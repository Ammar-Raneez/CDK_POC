import { APIGatewayProxyResult } from 'aws-lambda';
import AWS = require('aws-sdk');
import { ContactDetail } from '../lib/contact-detail.model';
import { getEventBody } from '../lib/util';
import { MissingFieldError } from '../lib/validator';

const emailSender = process.env.EMAIL_SENDER!;

export async function handler(
  event: any
): Promise<APIGatewayProxyResult> {
  try {
    console.log(event);
    let contactDetail;
    if (event.httpMethod) {
      contactDetail = getEventBody(event);
    } else {
      contactDetail = JSON.parse(event.Payload).auctionsToClose;
    }

    if (contactDetail.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify('No data')
      };
    }

    const toSendEmailPromises = contactDetail.map(
      (contactDetail: ContactDetail) => sendEmail(contactDetail)
    );
    await Promise.all(toSendEmailPromises);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Emails sent successfully 🎉🎉🎉' })
    }
  } catch (error) {
    let errStatusCode = 500;
    if (error instanceof MissingFieldError) {
      errStatusCode = 403;
    }

    return {
      statusCode: errStatusCode,
      body: JSON.stringify((error as any).message)
    }
  }
}

async function sendEmail({ bidder, title, seller }: ContactDetail) {
  const ses = new AWS.SES({ region: 'us-east-1' });
  await ses.sendEmail(sendEmailParams({ bidder, title, seller })).promise();
}

function sendEmailParams({ bidder, title, seller }: ContactDetail) {
  const toAddress = bidder || seller;

  return {
    Destination: {
      ToAddresses: [toAddress!],
    },
    Message: {
      Body: {
        Html: {
          Charset: 'UTF-8',
          Data: getHtmlContent({ bidder, title, seller }),
        },
        Text: {
          Charset: 'UTF-8',
          Data: getTextContent({ bidder, title, seller }),
        },
      },
      Subject: {
        Charset: 'UTF-8',
        Data: `Auction Item - ${title}`,
      },
    },
    Source: emailSender,
  };
}

function getHtmlContent({ bidder, title }: ContactDetail) {
  return `
    <html>
      <body>
        <p>Received an Email. 📬</p>
        <p style="font-size:18px">
          ${bidder ?
            'Congratulations! You have won the auction: ' + title :
            'Oops :( Looks like your auction item - ' + title + ' was not sold'
          }
        </p>
      </body>
    </html> 
  `;
}

function getTextContent({ bidder, title }: ContactDetail) {
  return `
    Received an Email. 📬
    ${bidder ?
      'Congratulations! You have won the auction: ' + title :
      'Oops :( Looks like your auction item - ' + title + ' was not sold'
    }
  `;
}
