import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { comparePassword, signSessionToken, COOKIE_NAME } from '@/lib/auth';
import { ensureInitialSeed } from '@/lib/seed';

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    await ensureInitialSeed();

    const body = await request.json();
    const { employeeId, email, password, role } = body;

    // 1. Employee Login via EmpId only
    if (employeeId) {
      const cleanEmpId = String(employeeId).trim();
      const user = await User.findOne({ employeeId: cleanEmpId });

      if (!user) {
        return NextResponse.json(
          { error: `Employee ID "${cleanEmpId}" not found. Please verify your EMP-ID.` },
          { status: 401 }
        );
      }

      if (user.role !== 'mr') {
        return NextResponse.json(
          { error: 'This login portal is only for Field Employees / MRs.' },
          { status: 403 }
        );
      }

      const token = await signSessionToken({
        userId: user._id.toString(),
        email: user.email || `${user.employeeId}@cipla.mr`,
        name: user.name,
        role: 'mr',
        employeeId: user.employeeId,
        location: user.location,
        region: user.region,
      });

      const response = NextResponse.json({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          employeeId: user.employeeId,
          location: user.location,
          role: user.role,
        },
      });

      response.cookies.set({
        name: COOKIE_NAME,
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      return response;
    }

    // 2. Admin Login via Email and Password
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: trimmedEmail });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Role check
    if (role && user.role !== role) {
      return NextResponse.json(
        { error: `This account is not authorized as ${role.toUpperCase()}` },
        { status: 403 }
      );
    }

    if (!user.password) {
      return NextResponse.json(
        { error: 'Password authentication not configured for this account' },
        { status: 401 }
      );
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const token = await signSessionToken({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      employeeId: user.employeeId,
      location: user.location,
      region: user.region,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
      },
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: unknown) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to authenticate' },
      { status: 500 }
    );
  }
}
