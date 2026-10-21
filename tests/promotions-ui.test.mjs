import {test} from 'node:test';
import assert from 'node:assert/strict';
import {codeFieldErrors,pricingLines,quoteCodeFields} from '../components/promotions-ui.mjs';

test('disabled codes preserve the legacy quote body while enabled codes use nullable v3 fields', () => {
  assert.deepEqual(quoteCodeFields({promotionsEnabled:false,referralsEnabled:false,promoCode:'SAVE',referralCode:'FRIEND'}),{});
  assert.deepEqual(quoteCodeFields({promotionsEnabled:true,referralsEnabled:false,promoCode:' SAVE ',referralCode:'FRIEND'}),{promoCode:'SAVE',referralCode:null});
  assert.deepEqual(quoteCodeFields({promotionsEnabled:true,referralsEnabled:true,promoCode:'   ',referralCode:' REF-10 '}),{promoCode:null,referralCode:'REF-10'});
});

test('code failures appear beside the correct buyer input', () => {
  assert.deepEqual(codeFieldErrors({fields:[
    {path:'promoCode',message:'This promotion is unavailable.'},
    {path:'referralCode',message:'Check this referral code.'},
    {path:'items[0]',message:'Choose another ticket.'},
  ]}), {promoCode:'This promotion is unavailable.',referralCode:'Check this referral code.'});
});

test('new receipts display server-supplied original and discounted cents; old receipts remain readable', () => {
  const serverPricing={originalTicketSubtotalMinor:5500,discountMinor:1100,discountedTicketSubtotalMinor:4400};
  assert.deepEqual(pricingLines(serverPricing,5500),[
    {label:'Original ticket price',amountMinor:5500},
    {label:'Promotion discount',amountMinor:-1100},
    {label:'Discounted ticket price',amountMinor:4400},
  ]);
  assert.deepEqual(pricingLines(null,5500),[{label:'Illustrative ticket subtotal',amountMinor:5500}]);
});
