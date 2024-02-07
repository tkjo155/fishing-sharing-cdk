import { Stack } from "aws-cdk-lib";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";

//プログラムがAWSのクラウド上で何かを作成するとき、追加の情報や設定を伝える
interface ExtendedProps extends cdk.StackProps {
  //VPCを作成する際に使用されるIPアドレスの範囲を指定するためのもの
  vpcCidr: string | undefined;
}
//拡張する新しいクラスを定義(AWS上のリソース（例: VPC、EC2インスタンスなど）をグループ化し、簡単に作成、更新、削除できるようにするもの)
export class VPC extends Stack {
  //新しい VPC オブジェクトを作成するときに呼び出されるもの
  constructor(scope: Construct, id: string, props: ExtendedProps) {
    super(scope, id, props);

    // vpc を宣言
    const vpc = new ec2.Vpc(this, "VPC", {
      //前のコードで指定された `vpcCidr` というプロパティから取得された値を使用
      ipAddresses: ec2.IpAddresses.cidr(`${props.vpcCidr}`),
      //VPC内の各サブネットの設定
      subnetConfiguration: [
        {
          cidrMask: 20,
          name: "Public-",
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 20,
          name: "Bastion-",
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 20,
          name: "Private-",
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 21,
          name: "Private-DB-",
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
      availabilityZones: ["ap-northeast-1a", "ap-northeast-1c"],
      natGateways: 0, // コストカットのためにnatgwは置かない。
    });
  }
}
