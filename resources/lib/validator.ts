import { Auction } from './auction.model';
import { ContactDetail } from './contact-detail.model';

export class MissingFieldError extends Error { }

export function validateCreateAuction(arg: any) {
  if (!(arg as Auction).title) {
    throw new MissingFieldError(`Value for title required! Got: ${JSON.stringify(arg)}`);
  }
  if (!(arg as Auction).seller) {
    throw new MissingFieldError(`Value for seller required! Got: ${JSON.stringify(arg)}`);
  }
}

export function validateBidAuction(arg: any) {
  if (!arg.amount) {
    throw new MissingFieldError(`Value for amount required! Got: ${JSON.stringify(arg)}`);
  }
  if (!arg.bidder) {
    throw new MissingFieldError(`Value for bidder required! Got: ${JSON.stringify(arg)}`);
  }
}
