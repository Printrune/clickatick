import Link from 'next/link';
import {SignIn} from '@clerk/nextjs';
import '../../organizer.css';

export const dynamic='force-dynamic';
export const metadata={title:'Organizer sign in',description:'Sign in to manage your clickatick brands.'};

export default function SignInPage(){const configured=Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim()&&process.env.CLERK_SECRET_KEY?.trim());return <div className="organizer-page organizer-signin"><div className="organizer-heading"><Link href="/">← Back to events</Link><h1>Sign in to manage events.</h1><p>Use your organizer account to manage brands and, when connected, publish new marketplace events.</p></div>{configured?<div className="organizer-signin-panel"><SignIn routing="path" path="/sign-in" forceRedirectUrl="/dashboard" signUpForceRedirectUrl="/dashboard"/><p><Link href="/">Cancel and return to events</Link></p></div>:<section className="organizer-state" role="alert"><h2>Organizer sign-in is being connected.</h2><p>Google and email sign-in are unavailable here. Your ticket draft remains on this device.</p><Link href="/creator">Return to ticket creation</Link></section>}</div>}
