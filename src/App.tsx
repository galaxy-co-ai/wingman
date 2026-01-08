/**
 * App Component
 * Main application component that wires together all features
 */

import { useCallback, useState, useMemo } from 'react';
import { MainLayout, RightPanelContent } from '@/components/layout';
import { TabBar, ChatSession } from '@/components/chat';
import { NewSessionModal } from '@/components/modals';
import { SessionBrowser } from '@/components/views';
import { useSessionsStore, useUIStore } from '@/stores';
import { useClaudeSession, useKeyboardShortcuts } from '@/hooks';
import type { Tab, ClaudeStatus, RightPanelMode } from '@/types';
import './styles/global.css';

function App() {
  // UI Store
  const {
    activeModal,
    openModal,
    closeModal,
    currentView,
    navigateTo,
    toggleRightPanel,
    rightPanelTab,
    setRightPanelTab,
    addNotification,
  } = useUIStore();

  // Sessions Store
  const {
    tabs,
    activeTabId,
    sessions,
    messages: allMessages,
    sessionStatuses,
    addTab,
    removeTab,
    setActiveTab,
    reorderTabs,
  } = useSessionsStore();

  // Get active session data
  const activeSession = activeTabId ? sessions[activeTabId] ?? null : null;
  const activeMessages = activeTabId ? allMessages[activeTabId] ?? [] : [];
  const activeStatus: ClaudeStatus = activeTabId
    ? sessionStatuses[activeTabId] ?? 'stopped'
    : 'stopped';

  // Claude session hook for the active session
  const {
    streamingMessageId,
    isLoading,
    createSession,
    loadSession,
    startCli,
    sendMessage,
    cancelResponse,
  } = useClaudeSession(activeTabId ?? undefined);

  // State for new session modal
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  // Handle creating a new session
  const handleCreateSession = useCallback(
    async (data: { workingDirectory: string; title?: string }) => {
      setIsCreatingSession(true);
      try {
        const session = await createSession({
          workingDirectory: data.workingDirectory,
          title: data.title,
        });

        // Create a new tab for this session
        const tab: Tab = {
          id: session.id,
          sessionId: session.id,
          title: session.title,
          isActive: true,
          isDirty: false,
        };
        addTab(tab);

        // Start the CLI
        await startCli(false);

        closeModal();
      } catch (err) {
        console.error('Failed to create session:', err);
        // Show error to user
        const errorMessage = err instanceof Error ? err.message : 'Failed to create session';
        addNotification({
          type: 'error',
          message: errorMessage,
          autoDismiss: false,
        });
      } finally {
        setIsCreatingSession(false);
      }
    },
    [createSession, addTab, startCli, closeModal, addNotification]
  );

  // Handle opening an existing session from browser
  const handleOpenSession = useCallback(
    async (sessionId: string) => {
      try {
        // Check if already open in a tab
        const existingTab = tabs.find((t) => t.sessionId === sessionId);
        if (existingTab) {
          setActiveTab(existingTab.id);
          navigateTo('main');
          return;
        }

        // Load the session
        await loadSession(sessionId);
        const session = sessions[sessionId];

        if (session) {
          // Create a new tab
          const tab: Tab = {
            id: session.id,
            sessionId: session.id,
            title: session.title,
            isActive: true,
            isDirty: false,
          };
          addTab(tab);

          // Start CLI with resume
          await startCli(true);
        }

        navigateTo('main');
      } catch (err) {
        console.error('Failed to open session:', err);
      }
    },
    [tabs, sessions, loadSession, addTab, startCli, setActiveTab, navigateTo]
  );

  // Handle tab selection
  const handleTabSelect = useCallback(
    (tabId: string) => {
      setActiveTab(tabId);
    },
    [setActiveTab]
  );

  // Handle tab close
  const handleTabClose = useCallback(
    (tabId: string) => {
      removeTab(tabId);
    },
    [removeTab]
  );

  // Handle new tab
  const handleNewTab = useCallback(() => {
    openModal('new-session');
  }, [openModal]);

  // Handle send message
  const handleSendMessage = useCallback(
    async (content: string) => {
      await sendMessage(content);
    },
    [sendMessage]
  );

  // Handle cancel
  const handleCancel = useCallback(() => {
    cancelResponse();
  }, [cancelResponse]);

  // Keyboard shortcuts
  const handleNextTab = useCallback(() => {
    if (tabs.length === 0) return;
    const currentIndex = tabs.findIndex((t) => t.id === activeTabId);
    const nextIndex = (currentIndex + 1) % tabs.length;
    setActiveTab(tabs[nextIndex].id);
  }, [tabs, activeTabId, setActiveTab]);

  const handlePrevTab = useCallback(() => {
    if (tabs.length === 0) return;
    const currentIndex = tabs.findIndex((t) => t.id === activeTabId);
    const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    setActiveTab(tabs[prevIndex].id);
  }, [tabs, activeTabId, setActiveTab]);

  const handleCloseCurrentTab = useCallback(() => {
    if (activeTabId) {
      removeTab(activeTabId);
    }
  }, [activeTabId, removeTab]);

  const handleFocusInput = useCallback(() => {
    // Focus the input in ChatSession
    const input = document.querySelector('textarea[placeholder*="message"]') as HTMLTextAreaElement;
    input?.focus();
  }, []);

  useKeyboardShortcuts({
    onNewSession: handleNewTab,
    onCloseTab: handleCloseCurrentTab,
    onNextTab: handleNextTab,
    onPrevTab: handlePrevTab,
    onOpenBrowser: () => navigateTo('session-browser'),
    onToggleRightPanel: toggleRightPanel,
    onFocusInput: handleFocusInput,
    onCancel: handleCancel,
  });

  // Render the tab bar
  const tabBar = (
    <TabBar
      tabs={tabs}
      activeTabId={activeTabId}
      onTabSelect={handleTabSelect}
      onTabClose={handleTabClose}
      onNewTab={handleNewTab}
      onTabReorder={reorderTabs}
    />
  );

  // Render the left panel based on current view
  const leftPanel = useMemo(() => {
    if (currentView === 'session-browser') {
      return (
        <SessionBrowser
          onBack={() => navigateTo('main')}
          onOpenSession={handleOpenSession}
          onNewSession={handleNewTab}
        />
      );
    }

    return (
      <ChatSession
        session={activeSession}
        messages={activeMessages}
        streamingMessageId={streamingMessageId}
        isLoading={isLoading}
        onSend={handleSendMessage}
        onCancel={handleCancel}
        onNewSession={handleNewTab}
      />
    );
  }, [
    currentView,
    activeSession,
    activeMessages,
    streamingMessageId,
    isLoading,
    handleSendMessage,
    handleCancel,
    handleNewTab,
    handleOpenSession,
    navigateTo,
  ]);

  // Right panel content (Preview/Activity/Dashboard)
  const rightPanel = (
    <RightPanelContent
      activeTab={rightPanelTab as RightPanelMode}
      sessionId={activeTabId}
      workingDirectory={activeSession?.workingDirectory ?? null}
    />
  );

  return (
    <>
      <MainLayout
        leftPanel={leftPanel}
        rightPanel={rightPanel}
        tabBar={currentView === 'main' ? tabBar : undefined}
        claudeStatus={
          activeStatus === 'starting' ? 'busy' :
          activeStatus === 'stopped' ? 'offline' :
          activeStatus
        }
        rightPanelMode={rightPanelTab as RightPanelMode}
        onRightPanelModeChange={setRightPanelTab}
      />

      {/* New Session Modal */}
      <NewSessionModal
        isOpen={activeModal === 'new-session'}
        onClose={closeModal}
        onSubmit={handleCreateSession}
        isSubmitting={isCreatingSession}
      />
    </>
  );
}

export default App;
