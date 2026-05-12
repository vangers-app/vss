import { InventoryFrame } from "../inventory/inventory-frame";

export function InappFrame(props: { closeActiveUi: () => void }) {
    return <InventoryFrame closeActiveUi={props.closeActiveUi} />;
}
