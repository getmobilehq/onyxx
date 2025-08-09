import { useState, useEffect } from 'react';
import { Plus, Copy, Check, X, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import api from '@/services/api';

interface Token {
  id: string;
  code: string;
  status: 'active' | 'used' | 'expired';
  organization_name?: string;
  used_by?: string;
  used_by_email?: string;
  used_at?: string;
  expires_at: string;
  created_at: string;
  created_by_email?: string;
}

export function TokensPage() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [organizationName, setOrganizationName] = useState('');
  const [expiresInDays, setExpiresInDays] = useState(30);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    fetchTokens();
  }, []);

  const fetchTokens = async () => {
    try {
      const response = await api.get('/tokens/list');
      setTokens(response.data.tokens);
    } catch (error) {
      toast.error('Failed to fetch tokens');
    } finally {
      setLoading(false);
    }
  };

  const createToken = async () => {
    try {
      const response = await api.post('/tokens/create', {
        organization_name: organizationName || undefined,
        expires_in_days: expiresInDays,
      });
      
      const newToken = response.data.token;
      setTokens([newToken, ...tokens]);
      setIsCreateOpen(false);
      setOrganizationName('');
      
      toast.success(`Token created: ${newToken.code}`);
      
      // Auto-copy the new token
      await copyToClipboard(newToken.code);
    } catch (error) {
      toast.error('Failed to create token');
    }
  };

  const revokeToken = async (tokenId: string) => {
    try {
      await api.put(`/tokens/${tokenId}/revoke`);
      setTokens(tokens.map(t => 
        t.id === tokenId ? { ...t, status: 'expired' } : t
      ));
      toast.success('Token revoked');
    } catch (error) {
      toast.error('Failed to revoke token');
    }
  };

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
      toast.success('Token code copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy token code');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'used':
        return <Badge className="bg-blue-100 text-blue-800">Used</Badge>;
      case 'expired':
        return <Badge className="bg-gray-100 text-gray-800">Expired</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Token Management
              </CardTitle>
              <CardDescription>
                Generate and manage signup tokens for new organizations
              </CardDescription>
            </div>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Generate Token
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Generate New Token</DialogTitle>
                  <DialogDescription>
                    Create a new signup token for a paid organization
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="org-name">Organization Name (Optional)</Label>
                    <Input
                      id="org-name"
                      placeholder="Acme Corporation"
                      value={organizationName}
                      onChange={(e) => setOrganizationName(e.target.value)}
                    />
                    <p className="text-sm text-gray-500">
                      Leave blank to let the user choose their organization name
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expires">Expires In (Days)</Label>
                    <Input
                      id="expires"
                      type="number"
                      min="1"
                      max="365"
                      value={expiresInDays}
                      onChange={(e) => setExpiresInDays(Number(e.target.value))}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createToken}>Generate Token</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading tokens...</div>
          ) : tokens.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No tokens generated yet. Click "Generate Token" to create one.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Token Code</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Used By</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tokens.map((token) => (
                  <TableRow key={token.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="font-mono text-sm">{token.code}</code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(token.code)}
                        >
                          {copiedCode === token.code ? (
                            <Check className="h-3 w-3 text-green-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>{token.organization_name || '-'}</TableCell>
                    <TableCell>{getStatusBadge(token.status)}</TableCell>
                    <TableCell>
                      {token.used_by_email ? (
                        <div>
                          <div className="text-sm">{token.used_by_email}</div>
                          {token.used_at && (
                            <div className="text-xs text-gray-500">
                              {formatDate(token.used_at)}
                            </div>
                          )}
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>{formatDate(token.expires_at)}</TableCell>
                    <TableCell>
                      <div className="text-sm">{token.created_by_email || 'System'}</div>
                      <div className="text-xs text-gray-500">{formatDate(token.created_at)}</div>
                    </TableCell>
                    <TableCell>
                      {token.status === 'active' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => revokeToken(token.id)}
                        >
                          <X className="h-4 w-4 text-red-600" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}