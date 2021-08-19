import { Bang, DefaultObject, isBang } from "../sdk";
import type { IInletsMeta, IOutletsMeta } from "@jspatcher/jspatcher/src/core/objects/base/AbstractObject";

export default class audioContext extends DefaultObject<{}, {}, [Bang], [AudioContext]> {
    static description = "Get currrent patcher's audio context";
    static inlets: IInletsMeta = [{
        isHot: true,
        type: "bang",
        description: "Output current audio context"
    }];
    static outlets: IOutletsMeta = [{
        type: "object",
        description: "Current audio context"
    }];
    subscribe() {
        super.subscribe();
        this.on("preInit", () => {
            this.inlets = 1;
            this.outlets = 1;
        });
        this.on("inlet", ({ data, inlet }) => {
            if (inlet === 0) {
                if (isBang(data)) this.outlet(0, this.patcher.audioCtx);
            }
        });
    }
}
