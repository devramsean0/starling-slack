import { App, ExpressReceiver } from '@slack/bolt';
import express from 'express';
import crypto from 'crypto';

// Initializes your app with your bot token and signing secret

const receiver = new ExpressReceiver({ signingSecret: String(process.env.SLACK_SIGNING_SECRET) });

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver
});
receiver.router.use(express.json());

receiver.router.post('/starling/feed-item', async (req, res) => {
    app.logger.info("Received a request");
    const signature = req.headers['x-hook-signature'];
    if (!signature) {
      app.logger.error('Missing hook signature');
      res.status(403).send('Missing hook signature');
      return
    }

    const body = JSON.stringify(req.body);
    const verifier = crypto.createVerify('sha512');
    verifier.update(body);
    verifier.end();

    const isVerified = verifier.verify(process.env.STARLING_WEBHOOK_KEY as string, signature as string, 'base64');
    if (!isVerified) {
      app.logger.error('Signature mismatch');
      res.status(403).send('Signature mismatch');
      return
    }
    res.status(200).send('OK');
    const content: IStarlingWebhookFeedItemContent = req.body.content;
    app.logger.info(`Transaction: ${content.amount.minorUnits / 100} ${content.amount.currency} from ${content.counterPartyName}`);
    
    await app.client.chat.postMessage({
      channel: process.env.SLACK_CHANNEL || '',
      text: `${content.source.replaceAll("_", " ").toLocaleLowerCase()} ${content.direction == "IN" ? "to" : "from"} ${content.counterPartyName} for ${content.amount.minorUnits / 100} ${content.amount.currency}`,
      username: content.counterPartyName,
      icon_url: "https://cdn.brandfetch.io/id65Uj_bLX/w/400/h/400/theme/dark/icon.jpeg?c=1dxbfHSJFAPEGdCLU4o5B"
    })
});

(async () => {
  // Start your app
  await app.start(process.env.PORT || 3000);

  app.logger.info('⚡️ Bolt app is running!');
})();

interface IStarlingWebhookFeedItemContent {
  feedItemUid: string;
  categoryUid: string;
  amountUid: string;
  amount: {
    currency: string;
    minorUnits: number;
  };
  sourceAmount: {
    currency: string;
    minorUnits: number;
  };
  direction: string;
  updatedAt: string;
  transactionTime: string;
  settlementTime: string;
  source: string;
  sourceSubType: string;
  status: string;
  transactingApplicationUserUid: string;
  counterPartyType: string;
  counterPartyUid: string;
  counterPartyName: string;
  counterPartySubEntityUid: string;
  counterPartySubEntityName: string;
  counterPartySubEntityIdentifier: string;
  counterPartySubEntitySubIdentifier: string;
  exchangeRate: number;
  totlFeeAmount: {
    currency: string;
    minorUnits: number;
  };
  reference: string;
  country: string;
  spendingCategory: string;
  userNote: string;
  roundUp: {
    goalCategoryUid: string;
    amount: {
      currency: string;
      minorUnits: number;
    };
  };
  hasAttachment: boolean;
  recieptPresent: boolean;
  feedItemFaiureReason: string;
  masterCardFeedDetails: {
    merchantIdentifier: string;
    mcc: number;
    posTimestamp: {
      hour: number;
      minute: number;
      second: number;
      nano: number;
    };
    authorisationCode: string;
    cardLast4: string;
  };
  sourceUid: string;
}