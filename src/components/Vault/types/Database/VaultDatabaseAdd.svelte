<script lang="ts">
    import UIkit from "uikit";

    import { getContext } from "svelte";

    import DatabaseForm from "$components/Vault/types/Database/_DatabaseForm.svelte";
    import ItemForm from "$components/Vault/types/templates/CreateUpdateItemForm.svelte";

    import { newVaultItem } from "$lib/stores";
    import { CipherType, type CipherDatabaseData } from "$lib/types";
    import { createVaultItem } from "$lib/vaults";

    const mk: string = getContext("mk");
    const epsk: string = getContext("epsk");

    let itemDetails = {
        name: "Database",
        notes: "",
    };
    let itemData: CipherDatabaseData = {
        engine: "",
        connectionType: "URL",
        url: "",
        host: "",
        port: "",
        database: "",
        username: "",
        password: ""
    };
    let errors: Array<string> = [];

    const onSubmit = async (e: any) => {
        e.preventDefault();

        if (!e.target.checkValidity()) {
            return;
        }

        try {

           $newVaultItem = await createVaultItem({
                mk:mk,
                epsk:epsk,
                name:itemDetails.name,
                notes:itemDetails.notes,
                content:itemData.engine || itemDetails.name,
                itemData:itemData,
                cipherType:CipherType.DATABASE
            })

            UIkit.modal("#vault-modal").hide();

            setTimeout(() => {
                e.target.reset();
                // Reset to default values.
                setTimeout(() => {
                    errors = [];
                    itemDetails.name = "Database";
                }, 500);
            });
        } catch (error) {
            errors = [(error as Error).message];
        }
    };

</script>

<div class="uk-modal-body">
    <ItemForm
        id="databaseForm"
        onsubmit={onSubmit}
        {itemDetails}
        {errors}
    >
        <DatabaseForm title="Database Credentials" data={itemData} />
    </ItemForm>
</div>

<div class="uk-modal-footer uk-flex uk-flex-row-reverse">
    <div class="uk-margin">
        <button form="databaseForm" type="submit" class="uk-button uk-button-primary uk-border-rounded">Save</button>
        <button onclick={() => {UIkit.modal("#vault-modal").hide()}}  class="uk-button uk-button-default uk-border-rounded">Cancel</button>
    </div>
</div>
