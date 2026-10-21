'use client';
import Link from 'next/link';
import '../../organizer.css';
export default function SignInError({reset}){return <section className="organizer-page"><div className="organizer-state" role="alert"><h1>Sign-in could not finish.</h1><p>Please try again. Your ticket draft remains on this device.</p><button type="button" onClick={()=>reset()}>Try sign-in again</button><p><Link href="/">Return to events</Link></p></div></section>;}
