#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import * as dotenv from "dotenv";
import { VPC } from "../lib/vpc";
import { EC2 } from "../lib/ec2";
import { RDS } from "../lib/rds";

//CDKアプリケーションの新しいインスタンスを作成
const app = new cdk.App();
//"cdk-training" というキーに関連する設定情報を取得
const context = app.node.tryGetContext("fishing-sharing-cdk");
//dotenv ライブラリを使用して、.env ファイルから環境変数を読み込む
dotenv.config({ path: ".env" });
//インポートしたVPCクラスを使用してCDKアプリケーション上に新しいVPCを作成
const vpc = new VPC(app, "cdkFishingVpc", {
  vpcCidr: context.vpcCidr,
  // AWS 環境に関する情報
  env: {
    region: context.region,
    account: context.accountId,
  },
});
//EC2の情報やAWS環境の詳細などの特定のパラメーターを使用してスタックのインスタンスを作成
const ec2 = new EC2(app, "cdkFishingEc2", {
  vpcId: context.vpcId,
  vpcCidr: context.vpcCidr,
  env: {
    region: context.region,
    account: context.accountId,
  },
});

const rds = new RDS(app, "cdkFishingRds", {
  vpcId: context.vpcId,
  vpcCidr: context.vpcCidr,
  env: {
    region: context.region,
    account: context.accountId,
  },
});
