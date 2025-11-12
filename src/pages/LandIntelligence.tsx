import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Plus, Search } from 'lucide-react';
import { ParcelForm } from '@/components/forms/ParcelForm';
import { ParcelDetail } from '@/components/ParcelDetail';
import { SearchLandDialog } from '@/components/SearchLandDialog';
import { Badge } from '@/components/ui/badge';

interface Parcel {
  id: string;
  name: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  county: string | null;
  acreage: number | null;
  status: string;
  best_use: string | null;
  score_data_center: number | null;
  score_luxury: number | null;
  asking_price: number | null;
  listing_url: string | null;
  canonical_url: string | null;
  url_status: string | null;
  parcel_utilities?: Array<{ available_mw_estimate: number | null }>;
}

export default function LandIntelligence() {
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedParcelId, setSelectedParcelId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  
  const [filters, setFilters] = useState({
    state: '',
    county: '',
    bestUse: '',
    status: '',
    minAcreage: '',
    maxAcreage: '',
  });

  useEffect(() => {
    loadParcels();
  }, [filters]);

  const loadParcels = async () => {
    let query = supabase
      .from('parcels')
      .select('*, parcel_utilities(available_mw_estimate)')
      .order('created_at', { ascending: false });

    if (filters.state) query = query.eq('state', filters.state);
    if (filters.county) query = query.ilike('county', `%${filters.county}%`);
    if (filters.bestUse) query = query.eq('best_use', filters.bestUse);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.minAcreage) query = query.gte('acreage', parseFloat(filters.minAcreage));
    if (filters.maxAcreage) query = query.lte('acreage', parseFloat(filters.maxAcreage));

    const { data } = await query;
    setParcels(data || []);
  };

  const getScoreColor = (score: number | null) => {
    if (!score) return 'bg-gray-100 text-gray-800';
    if (score >= 70) return 'bg-green-100 text-green-800';
    if (score >= 50) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      Sourcing: 'bg-gray-100 text-gray-800',
      Prospecting: 'bg-blue-100 text-blue-800',
      Qualified: 'bg-green-100 text-green-800',
      Rejected: 'bg-red-100 text-red-800',
      Under_Contract: 'bg-purple-100 text-purple-800',
      Closed: 'bg-slate-100 text-slate-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Intelligent Land Prospecting</h1>
            <p className="text-muted-foreground">
              Parcel prospecting and enrichment
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setSearchOpen(true)} variant="outline">
              <Search className="mr-2 h-4 w-4" />
              Search Listings
            </Button>
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Parcel
            </Button>
          </div>
        </div>

        <SearchLandDialog
          open={searchOpen}
          onOpenChange={setSearchOpen}
          onSuccess={loadParcels}
        />

        <ParcelForm 
          open={formOpen} 
          onOpenChange={setFormOpen} 
          onSuccess={loadParcels}
        />

        <ParcelDetail
          parcelId={selectedParcelId}
          open={detailOpen}
          onOpenChange={setDetailOpen}
          onRefresh={loadParcels}
        />

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-6">
              <div>
                <Input
                  placeholder="State (e.g., TX)"
                  value={filters.state}
                  onChange={(e) => setFilters({ ...filters, state: e.target.value.toUpperCase() })}
                  maxLength={2}
                />
              </div>
              <div>
                <Input
                  placeholder="County"
                  value={filters.county}
                  onChange={(e) => setFilters({ ...filters, county: e.target.value })}
                />
              </div>
              <div>
                <Select value={filters.bestUse || undefined} onValueChange={(v) => setFilters({ ...filters, bestUse: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Uses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Data_Center">Data Center</SelectItem>
                    <SelectItem value="Luxury">Luxury</SelectItem>
                    <SelectItem value="Mixed">Mixed</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Select value={filters.status || undefined} onValueChange={(v) => setFilters({ ...filters, status: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sourcing">Sourcing</SelectItem>
                    <SelectItem value="Prospecting">Prospecting</SelectItem>
                    <SelectItem value="Qualified">Qualified</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Input
                  type="number"
                  placeholder="Min Acres"
                  value={filters.minAcreage}
                  onChange={(e) => setFilters({ ...filters, minAcreage: e.target.value })}
                />
              </div>
              <div>
                <Input
                  type="number"
                  placeholder="Max Acres"
                  value={filters.maxAcreage}
                  onChange={(e) => setFilters({ ...filters, maxAcreage: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Parcels Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {parcels.map((parcel) => (
            <Card 
              key={parcel.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => {
                setSelectedParcelId(parcel.id);
                setDetailOpen(true);
              }}
            >
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2 flex-1">
                      <MapPin className="h-4 w-4 text-primary mt-1" />
                      <div className="flex-1">
                        <h3 className="font-semibold">{parcel.name || 'Unnamed Parcel'}</h3>
                        <p className="text-sm text-muted-foreground">
                          {parcel.address && `${parcel.address}, `}
                          {parcel.city}, {parcel.state} {parcel.county ? `• ${parcel.county}` : ''}
                        </p>
                        {parcel.listing_url || parcel.canonical_url ? (
                          <a 
                            href={parcel.canonical_url || parcel.listing_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View Listing →
                            {parcel.url_status && parcel.url_status !== 'valid' && parcel.url_status !== 'unknown' && (
                              <Badge variant="destructive" className="text-xs h-4 px-1">
                                {parcel.url_status}
                              </Badge>
                            )}
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">Source link unavailable (demo)</span>
                        )}


                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge className={getStatusColor(parcel.status)}>
                      {parcel.status}
                    </Badge>
                    {parcel.best_use && (
                      <Badge variant="outline">
                        {parcel.best_use.replace('_', ' ')}
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {parcel.acreage && (
                      <div>
                        <span className="text-muted-foreground">Acres:</span>{' '}
                        <span className="font-medium">{Number(parcel.acreage).toFixed(1)}</span>
                      </div>
                    )}
                    {parcel.parcel_utilities?.[0]?.available_mw_estimate && (
                      <div>
                        <span className="text-muted-foreground">MW:</span>{' '}
                        <span className="font-medium">{parcel.parcel_utilities[0].available_mw_estimate}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {parcel.score_data_center !== null && (
                      <Badge className={getScoreColor(parcel.score_data_center)}>
                        DC: {parcel.score_data_center.toFixed(0)}
                      </Badge>
                    )}
                    {parcel.score_luxury !== null && (
                      <Badge className={getScoreColor(parcel.score_luxury)}>
                        Lux: {parcel.score_luxury.toFixed(0)}
                      </Badge>
                    )}
                  </div>

                  {parcel.asking_price && (
                    <p className="text-sm font-semibold text-primary">
                      ${(Number(parcel.asking_price) / 1000000).toFixed(2)}M
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {parcels.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                No parcels found. Add a parcel to get started.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
