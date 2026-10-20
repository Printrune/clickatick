 'use client';
import EventScene from './EventScene';
import {emptyListing} from '../lib/listing.mjs';
export default function IdeaEntry({expanded,bubbleAnchor,appearance}){
 return <section className="idea-entry" aria-label="Create an event listing" aria-hidden={expanded}>
  <div className="idea-copy idea-copy-straplines"><h1 className="idea-platform-line">The ticket platform that isn’t ripping anyone off.</h1><p className="idea-subtitle">Keep 90%.<br/>Pay with anything.</p><p className="idea-guest-line"><strong>Your guests pay the ticket price.<br/>Not a penny more.</strong></p><p>Tell us about your event or activity. We will prepare the details and ticket types for you to review.</p></div>
  <div className="idea-portrait"><span ref={bubbleAnchor} className="thought-anchor" aria-hidden="true"/><EventScene draft={emptyListing()} appearance={appearance} compact/><span className="portrait-caption">Your event. Your tickets.</span></div>
 </section>;
}

