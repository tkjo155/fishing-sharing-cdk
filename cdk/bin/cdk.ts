#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import * as dotenv from "dotenv";
import { VPC } from "../lib/vpc";

const app = new cdk.App();
const context = app.node.tryGetContext("fishing-sharing-cdk");
dotenv.config({ path: ".env" });

const vpc = new VPC(app, "cdkFishingVpc", {
  vpcCidr: context.vpcCidr,
  env: {
    region: context.region,
    account: context.accountId,
  },
});
