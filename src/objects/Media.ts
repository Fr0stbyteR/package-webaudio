import WebAudioObject from "./base";
import { Bang, isBang } from "../sdk";
import type { IInletsMeta, IOutletsMeta } from "@jspatcher/jspatcher/src/core/objects/base/AbstractObject";

type I = [Bang | HTMLMediaElement];
export default class Media extends WebAudioObject<MediaElementAudioSourceNode, { element: HTMLMediaElement }, I, [null, MediaElementAudioSourceNode], [], {}> {
    static description = "WebAudio MediaElementAudioSourceNode";
    static inlets: IInletsMeta = [{
        isHot: true,
        type: "object",
        description: "HTMLMediaElement to construct node, bang to output MediaElementAudioSourceNode instance"
    }];
    static outlets: IOutletsMeta = [{
        type: "signal",
        description: "Node connection"
    }, {
        type: "object",
        description: "Instance: MediaElementAudioSourceNode"
    }];
    _ = { node: undefined as MediaElementAudioSourceNode, element: undefined as HTMLMediaElement };
    subscribe() {
        super.subscribe();
        this.on("preInit", () => {
            this.inlets = 1;
            this.outlets = 2;
        });
        this.on("inlet", ({ data, inlet }) => {
            if (inlet === 0) {
                if (isBang(data)) {
                    if (this.node) this.outlet(1, this.node);
                } else if (data instanceof HTMLMediaElement) {
                    this._.element = data;
                    this.resetNode();
                    this.outlet(1, this.node);
                }
            }
        });
    }
    resetNode() {
        this.disconnectAudio();
        this.node = this.audioCtx.createMediaElementSource(this._.element);
        this.node.channelInterpretation = "discrete";
        this.outletAudioConnections[0] = { node: this.node, index: 0 };
        this.connectAudio();
    }
}
