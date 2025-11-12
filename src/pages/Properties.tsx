import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PropertyForm } from '@/components/forms/PropertyForm';
import { PropertyDetail } from '@/components/PropertyDetail';
import { Notes } from '@/components/Notes';
import { supabase } from '@/integrations/supabase/client';
import { Home, MapPin, TrendingUp, Plus } from 'lucide-react';

interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  status: string;
  total_cost: number | null;
  target_resale_value: number | null;
  project?: { name: string };
}

export default function Properties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    const { data } = await supabase
      .from('properties')
      .select('*, project:projects(name)')
      .order('created_at', { ascending: false });

    setProperties(data || []);
  };

  const calculateSpread = (property: Property) => {
    if (!property.target_resale_value || !property.total_cost) return null;
    return Number(property.target_resale_value) - Number(property.total_cost);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Properties</h1>
            <p className="text-muted-foreground">Real estate assets</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Property
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Property</DialogTitle>
              </DialogHeader>
              <PropertyForm
                onSuccess={() => {
                  setDialogOpen(false);
                  loadProperties();
                }}
                onCancel={() => setDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>

        <PropertyDetail
          propertyId={selectedProperty?.id || null}
          open={detailOpen}
          onOpenChange={setDetailOpen}
          onRefresh={loadProperties}
        />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => {
            const spread = calculateSpread(property);
            return (
              <Card 
                key={property.id} 
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  setSelectedProperty(property);
                  setDetailOpen(true);
                }}
              >
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <Home className="h-5 w-5 text-primary mt-1" />
                    <div className="flex-1">
                      <CardTitle className="text-base mb-2">
                        {property.address}
                      </CardTitle>
                      <Badge variant="secondary" className="text-xs">
                        {property.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {property.city}, {property.state}
                    </span>
                  </div>

                  {property.project && (
                    <p className="text-sm text-muted-foreground">
                      {property.project.name}
                    </p>
                  )}

                  {property.total_cost && (
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Cost:</span>
                        <span className="font-medium">
                          ${(Number(property.total_cost) / 1000000).toFixed(2)}M
                        </span>
                      </div>
                      {property.target_resale_value && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Target Value:</span>
                            <span className="font-medium">
                              ${(Number(property.target_resale_value) / 1000000).toFixed(2)}M
                            </span>
                          </div>
                          {spread && (
                            <div className="flex justify-between items-center pt-2 border-t">
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <TrendingUp className="h-4 w-4" />
                                <span>Spread:</span>
                              </div>
                              <span className="font-bold text-primary">
                                ${(spread / 1000000).toFixed(2)}M
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  <div className="pt-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProperty(property);
                        setNotesDialogOpen(true);
                      }}
                    >
                      View Notes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Dialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedProperty?.address} - Notes
              </DialogTitle>
            </DialogHeader>
            {selectedProperty && (
              <Notes
                relatedType="property"
                relatedId={selectedProperty.id}
                title="Property Notes"
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
