# AWS CDK Infrastructure Setup

This guide deploys the Timezone Discord bot to AWS. The stack provisions an EC2 instance, a DynamoDB table for user timezones, an IAM role, and a security group.

## Prerequisites

- AWS CLI configured for the target account
- AWS CDK CLI (`npm install -g aws-cdk`)
- Node.js and npm
- An EC2 key pair and a Discord application token

Bootstrap CDK once for the target account and region:

```bash
cdk bootstrap aws://ACCOUNT-NUMBER/us-east-2
```

## Required Parameters

Create the EC2 key-pair parameter used by the stack:

```bash
aws ssm put-parameter \
  --name "/xiuh/ec2-keypair-name" \
  --value "xiuh-bot-key" \
  --type String
```

The `/xiuh` parameter prefix is retained for compatibility with the existing deployment. The bot token and optional Google API key should be supplied in `.env` when deploying the application.

## Deploy

Install dependencies and deploy the stack:

```bash
npm install
make infra.deploy
```

The stack outputs the instance IP address. Add it, together with the bot configuration, to `.env`:

```bash
DISCORD_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=your_discord_client_id
AWS_REGION=us-east-2
TIMEZONE_TABLE=xiuh-time
GOOGLE_API_KEY=your_google_api_key
EC2_HOST=your_instance_public_ip
EC2_USER=ec2-user
SSH_KEY=~/.ssh/xiuh-bot-key.pem
REMOTE_DIR=/home/ec2-user/xiuh-bot
SSH_DEPLOY_IP=your.public.ip.address/32
```

Deploy the bot and register its `/time` command:

```bash
make deploy
make deploy.commands
```

## Legacy Pet Resources

The pet game has been removed from the application and CDK definition. If an older stack already created `xiuh-pets` or `xiuh-pet-images`, removing those resources from the stack retains the physical data under the configured retain policy. Delete them manually only after confirming that their data is no longer needed.
