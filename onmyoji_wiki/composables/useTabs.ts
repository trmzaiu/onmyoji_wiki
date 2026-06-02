export function useTabs(defaultTab = "Main") {
    const activeTab = ref(defaultTab);

    function changeTab(tab: string) {
        activeTab.value = tab;

        history.replaceState(
            null,
            "",
            `${window.location.pathname}#${tab}`
        );
    }

    return {
        activeTab,
        changeTab,
    };
}