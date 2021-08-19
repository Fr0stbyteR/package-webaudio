import WebAudioObject from "./base";
import { Bang, isBang } from "../sdk";
import type { IInletsMeta, IOutletsMeta, IArgsMeta } from "@jspatcher/jspatcher/src/core/objects/base/AbstractObject";

export default class Splitter extends WebAudioObject<ChannelSplitterNode, {}, [Bang], (null | ChannelSplitterNode)[], [number]> {
    static description = "WebAudio ChannelSplitterNode";
    static inlets: IInletsMeta = [{
        isHot: true,
        type: "signal",
        description: "Node connection, bang to output ChannelSplitterNode instance, number to change outputs"
    }];
    static outlets: IOutletsMeta = [{
        type: "signal",
        description: "Node connection (1 channel)"
    }, {
        type: "object",
        description: "Instance: ChannelSplitterNode"
    }];
    static args: IArgsMeta = [{
        type: "number",
        optional: true,
        description: "Number of Outputs",
        default: 6
    }];
    _ = { node: null as ChannelSplitterNode };
    inletAudioConnections = [{ node: this.node, index: 0 }];
    subscribe() {
        super.subscribe();
        this.on("preInit", () => {
            this.inlets = 1;
            handleArgs(this.args);
        });
        const handleArgs = (args: [number?]) => {
            const channelCount = (args && typeof args[0] === "number" && ~~args[0]) > 0 ? ~~args[0] : 6;
            this.resetNode(channelCount);
        };
        this.on("updateArgs", handleArgs);
        this.on("inlet", ({ data, inlet }) => {
            if (inlet === 0) {
                if (typeof data === "number") {
                    const channelCount = ~~data > 0 ? ~~data : 6;
                    if (this.node && channelCount !== this.node.numberOfOutputs) this.resetNode(channelCount);
                    this.outlet(this.outlets - 1, this.node);
                } else if (isBang(data)) this.outlet(this.outlets - 1, this.node);
            }
        });
    }
    resetNode(channelCount: number) {
        this.disconnectAudio();
        this.node = this.audioCtx.createChannelSplitter(channelCount);
        this.node.channelInterpretation = "discrete";
        const factoryMeta = Splitter.meta as this["meta"];
        const signalOutlet = factoryMeta.outlets[0];
        const nodeOutlet = factoryMeta.outlets[1];
        this.inletAudioConnections = [{ node: this.node, index: 0 }];
        this.outletAudioConnections = [];
        for (let i = 0; i < channelCount; i++) {
            factoryMeta.outlets[i] = signalOutlet;
            this.outletAudioConnections[i] = { node: this.node, index: i };
        }
        factoryMeta.outlets[channelCount] = nodeOutlet;
        this.setMeta(factoryMeta);
        this.outlets = channelCount + 1;
        this.connectAudio();
    }
}
