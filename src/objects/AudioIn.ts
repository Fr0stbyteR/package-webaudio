import { Bang, isBang } from "../sdk";
import WebAudioObject from "./base";
import type { IArgsMeta, IInletsMeta, IOutletsMeta, IPropsMeta } from "@jspatcher/jspatcher/src/core/objects/base/AbstractObject";

export interface Constraints extends MediaTrackConstraintSet {
    deviceId: string;
    autoGainControl: boolean;
    channelCount: number;
    echoCancellation: boolean;
    latency: number;
    noiseSuppression: boolean;
    sampleRate: number;
    sampleSize: number;
}
export default class AudioIn extends WebAudioObject<MediaStreamAudioSourceNode, { search: string; stream: MediaStream }, [string | Bang], [null, MediaStreamAudioSourceNode], [string], Constraints> {
    static description = "Get Audio input from device name or ID";
    static inlets: IInletsMeta = [{
        isHot: true,
        type: "anything",
        description: "string to fetch device name or ID, bang to output Node"
    }];
    static outlets: IOutletsMeta = [{
        type: "signal",
        description: "Node connection"
    }, {
        type: "object",
        description: "Instance: MediaStreamAudioSourceNode"
    }];
    static args: IArgsMeta = [{
        type: "string",
        optional: false,
        description: "Device name or ID"
    }];
    static props: IPropsMeta<Omit<Constraints, "deviceId">> = {
        autoGainControl: {
            type: "boolean",
            default: false,
            description: "Automatic gain control"
        },
        channelCount: {
            type: "number",
            default: undefined,
            description: "The number of independent channels of sound"
        },
        echoCancellation: {
            type: "boolean",
            default: false,
            description: "Remove all the sound being played from the input signals recorded by the microphones"
        },
        latency: {
            type: "number",
            default: undefined,
            description: "The latency or latency range, in seconds"
        },
        noiseSuppression: {
            type: "boolean",
            default: false,
            description: "Noise suppression"
        },
        sampleRate: {
            type: "number",
            default: undefined,
            description: "The sample rate in samples per second for the audio data"
        },
        sampleSize: {
            type: "number",
            default: undefined,
            description: "The linear sample size in bits"
        }
    };
    _ = { node: undefined as MediaStreamAudioSourceNode, stream: undefined as MediaStream, search: undefined as string };
    handleDeviceChange = async () => {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const enums = devices.filter(d => d.kind === "audioinput").map(d => d.label || d.deviceId);
        const { meta } = this;
        meta.args[0] = { ...AudioIn.args[0], type: "enum", enums };
        this.setMeta(meta);
    };
    newSearch = async (search?: string) => {
        this._.search = search;
        let deviceId: string;
        if (search) {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const device = devices.find(d => d.kind === "audioinput" && (d.deviceId === search || d.label === search));
            if (device) deviceId = device.deviceId;
        }
        this._.stream = await navigator.mediaDevices.getUserMedia({ audio: this.getConstraints(deviceId) });
        if (this._.stream) this.resetNode();
    };
    subscribe() {
        super.subscribe();
        this.on("preInit", () => {
            this.inlets = 1;
            this.outlets = 2;
        });
        this.on("postInit", () => {
            const search = this.box.args[0];
            navigator.mediaDevices.addEventListener("devicechange", this.handleDeviceChange);
            this.handleDeviceChange();
            this.newSearch(search);
        });
        this.on("updateArgs", (args: [string?]) => {
            this.newSearch(args[0]);
        });
        this.on("updateProps", () => {
            this.newSearch(this._.search);
        });
        this.on("inlet", async ({ data, inlet }) => {
            if (inlet === 0) {
                if (!isBang(data)) {
                    await this.newSearch(data);
                }
                if (this.node) this.outlet(1, this.node);
            }
        });
        this.on("destroy", () => {
            navigator.mediaDevices.removeEventListener("devicechange", this.handleDeviceChange);
        });
    }
    getConstraints(deviceId?: string): Constraints {
        return {
            deviceId,
            autoGainControl: this.getProp("autoGainControl"),
            channelCount: this.getProp("channelCount"),
            echoCancellation: this.getProp("echoCancellation"),
            latency: this.getProp("latency"),
            noiseSuppression: this.getProp("noiseSuppression"),
            sampleRate: this.getProp("sampleRate"),
            sampleSize: this.getProp("sampleSize")
        };
    }
    resetNode() {
        this.disconnectAudio();
        if (this._.stream) {
            this.node = this.audioCtx.createMediaStreamSource(this._.stream);
            this.node.channelInterpretation = "discrete";
        }
        this.outletAudioConnections[0] = { node: this.node, index: 0 };
        this.connectAudio();
    }
}
