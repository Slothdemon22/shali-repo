import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL('/adminlogin', request.url));
  
  // Clear the admin token cookie
  response.cookies.delete('admin_token');
  
  return response;
}
