import {clerkMiddleware} from '@clerk/nextjs/server';
import {NextResponse} from 'next/server';

// Only organizer routes use Clerk. Public marketplace, creator and demo links stay open.
const configured=Boolean(process.env.CLERK_SECRET_KEY&&process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
const clerk=configured?clerkMiddleware():null;
export default function proxy(request,event){return clerk?clerk(request,event):NextResponse.next();}
export const config={matcher:['/dashboard/:path*','/sign-in/:path*','/api/v1/:path*','/api/planner/:path*']};
