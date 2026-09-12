import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RefreshCw } from 'lucide-react';

import { useStartIndexer } from '@/lib/useIndexer';
import { WalletBalance } from '@/components/WalletBalance';
import { TokenAggregateSupply } from '@/components/TokenAggregateSupply';
import { TokenInfo } from '@/components/TokenInfo';
import { RecentActivity } from '@/components/RecentActivity';
import { Bridge } from '@/components/Bridge';

const IndexerStarter = () => {
  const indexer = useStartIndexer();
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => indexer?.resetAllChains()}
      className="flex items-center gap-2"
    >
      <RefreshCw className="h-4 w-4" />
      Reset Indexer
    </Button>
  );
};

// ============================================================================
// Main App
// ============================================================================

function App() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between">
          <h1 className="text-xl font-bold">SuperchainERC20 Dev Tools</h1>
          <div className="flex items-center gap-4">
            <IndexerStarter />
          </div>
        </div>
      </header>

      <main className="container mx-auto py-6 space-y-6">
        {/* Overview Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <TokenInfo />
          <TokenAggregateSupply />
          <WalletBalance />
        </div>

        {/* Main Content */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Left Column - Tools */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <Bridge />
            </Card>
          </div>

          <div className="space-y-6">
            <RecentActivity />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
