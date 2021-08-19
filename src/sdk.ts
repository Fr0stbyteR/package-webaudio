import type { IJSPatcherSDK } from "@jspatcher/jspatcher/src/core/SDK";

const sdk = (globalThis as any).jspatcherEnv.sdk as IJSPatcherSDK;
export const {
    React,
    PatcherAudio,
    Patcher,
    Box,
    Line,
    BaseObject,
    BaseUI,
    DefaultObject,
    DefaultUI,
    generateRemotedObject,
    generateDefaultObject,
    generateRemoteObject,
    Bang,
    isBang
} = sdk;

export interface Bang extends InstanceType<typeof Bang> {}
export interface PatcherAudio extends InstanceType<typeof PatcherAudio> {}
export interface Patcher extends InstanceType<typeof Patcher> {}
export interface Box extends InstanceType<typeof Box> {}
export interface Line extends InstanceType<typeof Line> {}
export interface BaseObject extends InstanceType<typeof BaseObject> {}
