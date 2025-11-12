import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Download, ExternalLink } from 'lucide-react';

interface SearchLandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface LandListing {
  source: string;
  title: string;
  address: string;
  city: string;
  state: string;
  county?: string;
  acreage?: number;
  price?: number;
  listingUrl: string;
  description?: string;
  zoning?: string;
}

export function SearchLandDialog({ open, onOpenChange, onSuccess }: SearchLandDialogProps) {
  const { toast } = useToast();
  const [searching, setSearching] = useState(false);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<LandListing[]>([]);
  const [selectedListings, setSelectedListings] = useState<Set<number>>(new Set());
  
  const [filters, setFilters] = useState({
    state: 'TX',
    county: '',
    minAcreage: '',
    maxAcreage: '',
    bestUse: '',
  });

  const handleSearch = async () => {
    setSearching(true);
    setResults([]);
    setSelectedListings(new Set());
    
    try {
      const { data, error } = await supabase.functions.invoke('search-land', {
        body: {
          action: 'search',
          params: {
            state: filters.state,
            county: filters.county || undefined,
            minAcreage: filters.minAcreage ? parseFloat(filters.minAcreage) : undefined,
            maxAcreage: filters.maxAcreage ? parseFloat(filters.maxAcreage) : undefined,
            bestUse: filters.bestUse || undefined,
          },
        },
      });

      if (error) throw error;

      setResults(data.listings || []);
      
      toast({
        title: 'Search Complete',
        description: `Found ${data.listings?.length || 0} listings`,
      });
    } catch (error: any) {
      toast({
        title: 'Search Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSearching(false);
    }
  };

  const handleImport = async () => {
    const selected = results.filter((_, idx) => selectedListings.has(idx));
    
    if (selected.length === 0) {
      toast({
        title: 'No Selection',
        description: 'Please select listings to import',
        variant: 'destructive',
      });
      return;
    }

    setImporting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('search-land', {
        body: {
          action: 'import',
          listings: selected,
        },
      });

      if (error) throw error;

      toast({
        title: 'Import Complete',
        description: `Imported ${data.imported} parcels. Enrichment starting...`,
      });

      setResults([]);
      setSelectedListings(new Set());
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Import Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

  const toggleListing = (index: number) => {
    const newSelected = new Set(selectedListings);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedListings(newSelected);
  };

  const selectAll = () => {
    if (selectedListings.size === results.length) {
      setSelectedListings(new Set());
    } else {
      setSelectedListings(new Set(results.map((_, idx) => idx)));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Search Land Listings</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-5 gap-4">
                <div>
                  <label className="text-sm font-medium">State *</label>
                  <Input
                    value={filters.state}
                    onChange={(e) => setFilters({ ...filters, state: e.target.value.toUpperCase() })}
                    maxLength={2}
                    placeholder="TX"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">County</label>
                  <Input
                    value={filters.county}
                    onChange={(e) => setFilters({ ...filters, county: e.target.value })}
                    placeholder="Dallas"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Min Acres</label>
                  <Input
                    type="number"
                    value={filters.minAcreage}
                    onChange={(e) => setFilters({ ...filters, minAcreage: e.target.value })}
                    placeholder="10"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Max Acres</label>
                  <Input
                    type="number"
                    value={filters.maxAcreage}
                    onChange={(e) => setFilters({ ...filters, maxAcreage: e.target.value })}
                    placeholder="500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Best Use</label>
                  <Select value={filters.bestUse} onValueChange={(v) => setFilters({ ...filters, bestUse: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Data_Center">Data Center</SelectItem>
                      <SelectItem value="Luxury">Luxury</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="mt-4">
                <Button onClick={handleSearch} disabled={searching} className="w-full">
                  <Search className="mr-2 h-4 w-4" />
                  {searching ? 'Searching...' : 'Search Zillow, LoopNet & Realtor.com'}
                </Button>
              </div>

              <p className="text-xs text-muted-foreground mt-2">
                Searches public listings from Zillow, LoopNet, and Realtor.com
              </p>
            </CardContent>
          </Card>

          {/* Results */}
          {results.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedListings.size === results.length}
                    onCheckedChange={selectAll}
                  />
                  <span className="text-sm font-medium">
                    {selectedListings.size} of {results.length} selected
                  </span>
                </div>
                <Button 
                  onClick={handleImport} 
                  disabled={importing || selectedListings.size === 0}
                  size="sm"
                >
                  <Download className="mr-2 h-4 w-4" />
                  {importing ? 'Importing...' : 'Import Selected'}
                </Button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {results.map((listing, index) => (
                  <Card 
                    key={index}
                    className={`cursor-pointer transition-colors ${
                      selectedListings.has(index) ? 'border-primary bg-primary/5' : ''
                    }`}
                    onClick={() => toggleListing(index)}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedListings.has(index)}
                          onCheckedChange={() => toggleListing(index)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold">{listing.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                {listing.address}, {listing.city}, {listing.state}
                              </p>
                            </div>
                            <a
                              href={listing.listingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-primary hover:underline"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </div>
                          
                          <div className="flex gap-2 mt-2">
                            <Badge variant="secondary">{listing.source}</Badge>
                            {listing.acreage && (
                              <Badge variant="outline">{listing.acreage} acres</Badge>
                            )}
                            {listing.price && (
                              <Badge className="bg-green-100 text-green-800">
                                ${(listing.price / 1000000).toFixed(2)}M
                              </Badge>
                            )}
                            {listing.zoning && (
                              <Badge variant="outline">{listing.zoning}</Badge>
                            )}
                          </div>
                          
                          {listing.description && (
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                              {listing.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}

          {results.length === 0 && !searching && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  No results yet. Enter search criteria and click Search.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
