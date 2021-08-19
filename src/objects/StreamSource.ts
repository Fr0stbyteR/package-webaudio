import WebAudioObject from "./base";
import { Bang, isBang } from "../sdk";
import type { IInletsMeta, IOutletsMeta } from "@jspatcher/jspatcher/src/core/objects/base/AbstractObject";

type I = [Bang | MediaStream];
export default class StreamSrc extends WebAudioObject<MediaStreamAudioSourceNode, { stream: MediaStream }, I, [null, MediaStreamAudioSourceNode], [], {}> {
    static description = "WebAudio MediaStreamAudioSourceNode";
    static inlets: IInletsMeta = [{
        isHot: true,
        type: "object",
        description: "MediaStream to construct node, bang to output MediaStreamAudioSourceNode instance"
    }];
    static outlets: IOutletsMeta = [{
        type: "signal",
        description: "Node connection"
    }, {
        type: "object",
        description: "Instance: MediaStreamAudioSourceNode"
    }];
    _ = { node: undefined as MediaStreamAudioSourceNode, stream: undefined as MediaStream };
    subscribe() {
        super.subscribe();
        this.on("preInit", () => {
            this.inlets = 1;
            this.outlets = 2;
        });
        this.on("inlet", ({ data, inlet }) => {
            if (inlet === 0) {
                if (!isBang(data)) {
                    this._.stream = data;
                    this.resetNode();
                }
                if (this.node) this.outlet(1, this.node);
            }
        });
    }
    resetNode() {
        this.disconnectAudio();
        this.node = this.audioCtx.createMediaStreamSource(this._.stream);
        this.node.channelInterpretation = "discrete";
        this.outletAudioConnections[0] = { node: this.node, index: 0 };
        this.connectAudio();
    }
}
