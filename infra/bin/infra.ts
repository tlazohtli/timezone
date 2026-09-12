#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TimezoneStack } from '../lib/timezone-stack';

// Timezone Discord Bot Infrastructure
const app = new cdk.App();

new TimezoneStack(app, 'XiuhStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-2',
  },
  description: 'Timezone Discord Bot - Infrastructure for EC2, DynamoDB, and IAM',
});

app.synth();
