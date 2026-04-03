<script lang="ts">
    import { getContext, onMount } from "svelte";

    import ViewItemForm from "$components/Vault/types/templates/ViewItemForm.svelte";

    import { extractSymmetricKey } from "$lib/key-generation";
    import { VaultDetailTextField, VaultDetailPasswordField } from "$lib/models/data";
    import { loadVaultItemDetailFromStore } from "$lib/vaults";
    import { paramsToUrl, urlToParams } from "$lib/utils/database";

    import type { SymmetricKey } from "$lib/models/keys";
    import type { CipherDatabaseData, VaultItemDetail } from "$lib/types";

    let { vaultId } = $props();

    const epsk: string = getContext("epsk");
    const mk: string = getContext("mk");

    let vaultItemDetail: VaultItemDetail<CipherDatabaseData> | null = $state(null);
    let displayMode: "URL" | "PARAMETERS" = $state("URL");

    // Reactively build fields based on displayMode, converting if stored mode differs.
    const fields = $derived.by(() => {
        if (!vaultItemDetail) return [];

        const d = vaultItemDetail.data;
        const engineField = new VaultDetailTextField(d.engine, "Engine");

        if (displayMode === "URL") {
            // If saved as URL use it directly; otherwise build from params.
            const url = d.url ? d.url : paramsToUrl(d);
            return [
                engineField,
                new VaultDetailPasswordField(url || null, "Connection URL"),
            ].filter(f => f.value);
        } else {
            // If saved as PARAMETERS use them directly; otherwise parse from URL.
            let host = d.host, port = d.port, database = d.database,
                username = d.username, password = d.password;

            if (!host && d.url) {
                const parsed = urlToParams(d.url);
                host = parsed.host;
                port = parsed.port;
                database = parsed.database;
                username = parsed.username;
                password = parsed.password;
            }

            return [
                engineField,
                host     ? new VaultDetailTextField(host,     "Host")     : null,
                port     ? new VaultDetailTextField(port,     "Port")     : null,
                database ? new VaultDetailTextField(database, "Database") : null,
                username ? new VaultDetailTextField(username, "Username") : null,
                password ? new VaultDetailPasswordField(password, "Password") : null,
            ].filter(Boolean) as any[];
        }
    });

    onMount(async () => {
        let sk: SymmetricKey = await extractSymmetricKey(mk, epsk);
        vaultItemDetail = await loadVaultItemDetailFromStore<CipherDatabaseData>(vaultId, sk);
        displayMode = (vaultItemDetail.data.connectionType as "URL" | "PARAMETERS") ?? "URL";
    });
</script>

{#if vaultItemDetail}
    <div class="uk-padding">
        <ViewItemForm
            itemDetails={{"name": vaultItemDetail!.name, "notes": vaultItemDetail!.notes}}
            itemHistory={{
                "created": vaultItemDetail.created,
                "lastEdited": vaultItemDetail.updated,
            }}
            detailTitle="Database Credentials"
            {fields}
        >
            {#snippet beforeFields()}
                <div class="uk-padding-small uk-padding-remove-top">
                    <div class="x-pill-toggle" role="group" aria-label="View connection as">
                        <button
                            type="button"
                            class="x-pill-btn"
                            class:x-pill-active={displayMode === "URL"}
                            onclick={() => { displayMode = "URL"; }}
                        >
                            Connection URL
                        </button>
                        <button
                            type="button"
                            class="x-pill-btn"
                            class:x-pill-active={displayMode === "PARAMETERS"}
                            onclick={() => { displayMode = "PARAMETERS"; }}
                        >
                            Individual Parameters
                        </button>
                    </div>
                </div>
            {/snippet}
        </ViewItemForm>
    </div>
{/if}

<style>
    .x-pill-toggle {
        display: inline-flex;
        border: 1px solid #d0d5dd;
        border-radius: 8px;
        overflow: hidden;
        background: #f5f7fa;
    }

    .x-pill-btn {
        flex: 1;
        padding: 6px 18px;
        font-size: 0.85rem;
        font-weight: 500;
        border: none;
        background: transparent;
        color: #6b7280;
        cursor: pointer;
        transition: background 0.18s ease, color 0.18s ease;
        white-space: nowrap;
    }

    .x-pill-btn:hover:not(.x-pill-active) {
        background: #e8edf3;
        color: #374151;
    }

    .x-pill-active {
        background: #1e3a5f;
        color: #ffffff;
        border-radius: 6px;
    }
</style>
