import {effectiveLocation,mapLinks} from '../lib/setup.mjs';

export default function SetupPreview({setup}){
 if(!setup)return null;
 const location=effectiveLocation(setup),links=mapLinks(location);
 return <>
 {location.photo&&<img className="setup-preview-photo" src={location.photo.dataUrl} width="420" height="190" alt="Event or attraction location"/>}
 {links&&<section className="setup-preview-section"><h4>Exact meeting point</h4><p>{location.address}</p><small>{location.lat}, {location.lng}</small><div className="map-links"><a href={links.google} target="_blank" rel="noreferrer">Open pin in Google Maps</a><a href={links.bing} target="_blank" rel="noreferrer">Open pin in Bing Maps</a></div></section>}
 {setup.restrictions&&<section className="setup-preview-section"><h4>Participation restrictions</h4><p>{setup.restrictions}</p></section>}
 {setup.disclaimer&&<section className="setup-preview-section"><h4>Organiser disclaimer</h4><p>{setup.disclaimer}</p><small>{setup.disclaimerReviewed?'Reviewed by organiser. Intended for every issued ticket.':'Organiser review needed before use.'} Ticket issuance is not connected.</small></section>}
 {setup.refundPolicy&&<section className="setup-preview-section"><h4>Refund policy draft</h4><p>{setup.refundPolicy}</p><small>Review before use. Checkout does not enforce this policy in the preview.</small></section>}
 {setup.referrals.enabled&&<section className="setup-preview-section"><h4>Referral offer</h4><p>{setup.referrals.percentage!==''?`${setup.referrals.percentage}% of the ticket price, funded from the business share.`:'Choose a referral percentage.'}</p><small>Payment follows the event. No payout for cancelled events. Tracking and payouts are not connected.</small></section>}
 {setup.supportiveMessage&&<section className="setup-preview-section"><p>Your booking helps the organiser keep creating experiences. Thank you for your support.</p></section>}
 <section className="setup-preview-section"><h4>Digital confirmation</h4><p>Required for every completed ticket sale.</p><small>Confirmation delivery and ticket sales are not connected in this preview.</small></section>
 {setup.paymentPreferences.length>0&&<section className="setup-preview-section"><h4>Requested payment methods</h4><p>{setup.paymentPreferences.map(id=>({'card':'Cards','bank-transfer':'Bank transfers','digital-wallet':'Digital wallets','bitcoin':'Bitcoin','crypto':'Other crypto wallets','epay':'EPay (provider to confirm)'})[id]).join(', ')}</p><small>Preferences only. No payment services are activated.</small></section>}
 </>;
}
