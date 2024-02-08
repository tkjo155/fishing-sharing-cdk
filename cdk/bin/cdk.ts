#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import * as dotenv from "dotenv";
import { VPC } from "../lib/vpc";
import { EC2 } from "../lib/ec2";
import { RDS } from "../lib/rds";

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

const ec2 = new EC2(app, "cdkFishingEc2", {
  vpcId: context.vpcId,
  vpcCidr: context.vpcCidr,
  env: {
    region: context.region,
    account: context.accountId,
  },
});

const rds = new RDS(app, "cdkTrainingRds", {
  vpcId: context.vpcId,
  vpcCidr: context.vpcCidr,
  env: {
    region: context.region,
    account: context.accountId,
  },
});
