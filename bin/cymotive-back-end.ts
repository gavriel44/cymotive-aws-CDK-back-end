#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CymotiveBackEndStack } from '../lib/cymotive-back-end-stack';

const app = new cdk.App();
new CymotiveBackEndStack(app, 'CymotiveBackEndStack');
