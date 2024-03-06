import { CfnOutput, RemovalPolicy, Stack, Token } from "aws-cdk-lib";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";

interface ExtendedProps extends cdk.StackProps {
  vpcId: string | undefined;
  vpcCidr: string | undefined;
}

export class EC2 extends Stack {
  constructor(scope: Construct, id: string, props: ExtendedProps) {
    super(scope, id, props);

    /* VPC検索 */
    const vpc = ec2.Vpc.fromLookup(this, "VpcInEc2", {
      vpcId: props.vpcId,
    });

    /* Security Group（HTTP、HTTPS、SSH のルール） */
    const bastionSG = new ec2.SecurityGroup(this, "CDKFishingBastionSG", {
      vpc: vpc,
      allowAllOutbound: true,
      securityGroupName: "CDKFishingBastionSG",
    });

    const clientSG = new ec2.SecurityGroup(this, "CDKFishingClientSG", {
      vpc: vpc,
      allowAllOutbound: true,
      securityGroupName: "CDKFishingClientSG",
    });

    const serverSG = new ec2.SecurityGroup(this, "CDKFishingServerSG", {
      vpc: vpc,
      allowAllOutbound: true,
      securityGroupName: "CDKFishingServerSG",
    });

    bastionSG.addIngressRule(
      ec2.Peer.ipv4(`${process.env.LOCAL_IP}/32`), // curl ifconfig.meで確認した自分のpcのip
      ec2.Port.tcp(22) // SSH port
    );

    serverSG.addIngressRule(
      ec2.Peer.securityGroupId(bastionSG.securityGroupId),
      ec2.Port.tcp(22) // SSH port,
    );
    serverSG.addIngressRule(
      ec2.Peer.securityGroupId(clientSG.securityGroupId),
      ec2.Port.tcp(4000) // client → server へ4000ポートでアクセスできるようにする
    );

    clientSG.addIngressRule(
      ec2.Peer.securityGroupId(bastionSG.securityGroupId),
      ec2.Port.tcp(22) // SSH port,
    );
    // 全てのアクセスは3000ポートにのみアクセスできるようにする
    clientSG.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(3000));

    /* EC2 */
    // SSHキー作成
    const cfnBastionKeyPair = new ec2.CfnKeyPair(this, "cfnBastionKeyPair", {
      keyName: "cdk-fishing-bastion.pem",
    });
    cfnBastionKeyPair.applyRemovalPolicy(RemovalPolicy.DESTROY);
    const cfnClientKeyPair = new ec2.CfnKeyPair(this, "cfnClientKeyPair", {
      keyName: "cdk-fishing-client.pem",
    });
    cfnClientKeyPair.applyRemovalPolicy(RemovalPolicy.DESTROY);
    const cfnServerKeyPair = new ec2.CfnKeyPair(this, "cfnServerKeyPair", {
      keyName: "cdk-fishing-server.pem",
    });
    cfnServerKeyPair.applyRemovalPolicy(RemovalPolicy.DESTROY);

    // キーペア取得コマンドアウトプット
    new CfnOutput(this, "GetBastionSSHKeyCommand", {
      value: `aws ssm get-parameter --name /ec2/keypair/${cfnBastionKeyPair.getAtt(
        "KeyPairId"
      )}
        --region ${props.env?.region}
        --with-decryption bastion
        --query Parameter.Value
        --output text`,
    });
    new CfnOutput(this, "GetClientSSHKeyCommand", {
      value: `aws ssm get-parameter --name /ec2/keypair/${cfnClientKeyPair.getAtt(
        "KeyPairId"
      )}
        --region ${props.env?.region}
        --with-decryption client
        --query Parameter.Value
        --output text`,
    });
    new CfnOutput(this, "GetServerSSHKeyCommand", {
      value: `aws ssm get-parameter --name /ec2/keypair/${cfnServerKeyPair.getAtt(
        "KeyPairId"
      )}
        --region ${props.env?.region}
        --with-decryption server
        --query Parameter.Value
        --output text`,
    });

    // ec2 を作成
    const clientInstance = new ec2.Instance(this, "EC2Client", {
      //  VPC
      vpc,
      // Subnet Group
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      // Security Group
      securityGroup: clientSG,
      // EC2 インスタンスのタイプ
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T2,
        ec2.InstanceSize.MICRO
      ),
      // EC2 インスタンスのAMI
      machineImage: new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2023,
      }),
      // SSHキーを指定する
      keyName: Token.asString(cfnClientKeyPair.ref),
      // EC2のIAMにssmの許可を与える
      ssmSessionPermissions: true,
    });
    const serverInstance = new ec2.Instance(this, "EC2Server", {
      //  VPC
      vpc,
      // Subnet Group
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      // Security Group
      securityGroup: serverSG,
      // EC2 インスタンスのタイプ
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T2,
        ec2.InstanceSize.MICRO
      ),
      // EC2 インスタンスのAMI
      machineImage: new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2023,
      }),
      // SSHキーを指定する
      keyName: Token.asString(cfnServerKeyPair.ref),
      // EC2のIAMにssmの許可を与える
      ssmSessionPermissions: true,
    });

    const bastionInstance = new ec2.Instance(this, "EC2Bastion", {
      //  VPC
      vpc,
      // Subnet Group
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      // Security Group
      securityGroup: bastionSG,
      // EC2 インスタンスのタイプ
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T2,
        ec2.InstanceSize.MICRO
      ),
      // EC2 インスタンスのAMI
      machineImage: new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2023,
      }),
      // SSHキーを指定する
      keyName: Token.asString(cfnBastionKeyPair.ref),
      // EC2のIAMにssmの許可を与える
      ssmSessionPermissions: true,
    });
  }
}
