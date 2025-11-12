import { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Zap, FileText, Mountain, Image, Rocket, CheckCircle, XCircle, ExternalLink, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Notes } from '@/components/Notes';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ParcelDetailProps {
  parcelId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh: () => void;
}

export function ParcelDetail({ parcelId, open, onOpenChange, onRefresh }: ParcelDetailProps) {
  const [parcel, setParcel] = useState<any>(null);
  const [utilities, setUtilities] = useState<any>(null);
  const [zoning, setZoning] = useState<any>(null);
  const [rights, setRights] = useState<any>(null);
  const [topography, setTopography] = useState<any>(null);
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [disqualifyOpen, setDisqualifyOpen] = useState(false);
  const [disqualifyReason, setDisqualifyReason] = useState('');
  const [qualifyConfirmOpen, setQualifyConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (parcelId && open) {
      loadParcelDetails();
    }
  }, [parcelId, open]);

  const loadParcelDetails = async () => {
    if (!parcelId) return;

    const { data: parcelData } = await supabase
      .from('parcels')
      .select('*, project:projects(name), deal:deals(name, stage)')
      .eq('id', parcelId)
      .single();

    const { data: utilData } = await supabase
      .from('parcel_utilities')
      .select('*')
      .eq('parcel_id', parcelId)
      .maybeSingle();

    const { data: zoneData } = await supabase
      .from('parcel_zoning')
      .select('*')
      .eq('parcel_id', parcelId)
      .maybeSingle();

    const { data: rightsData } = await supabase
      .from('parcel_rights')
      .select('*')
      .eq('parcel_id', parcelId)
      .maybeSingle();

    const { data: topoData } = await supabase
      .from('parcel_topography')
      .select('*')
      .eq('parcel_id', parcelId)
      .maybeSingle();

    const { data: imgData } = await supabase
      .from('parcel_images')
      .select('*')
      .eq('parcel_id', parcelId);

    setParcel(parcelData);
    setUtilities(utilData);
    setZoning(zoneData);
    setRights(rightsData);
    setTopography(topoData);
    setImages(imgData || []);
  };

  const handleCreateProject = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('parcel-workflow', {
        body: {
          action: 'createProjectDraft',
          parcel_id: parcelId,
          user_id: user?.id,
        },
      });

      if (error) throw error;

      toast({
        title: 'Project Created',
        description: 'Project and deal created successfully',
      });

      loadParcelDetails();
      onRefresh();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const checkQualifyRequirements = () => {
    // Check if best_use is Data_Center and no MW value
    if (parcel.best_use === 'Data_Center' && !utilities?.available_mw_estimate) {
      setQualifyConfirmOpen(true);
    } else {
      handleQualify();
    }
  };

  const handleQualify = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('parcel-workflow', {
        body: {
          action: 'qualify',
          parcel_id: parcelId,
          user_id: user?.id,
        },
      });

      if (error) throw error;

      toast({
        title: 'Parcel Qualified',
        description: 'Deal advanced to Intro and task created',
      });

      setQualifyConfirmOpen(false);
      loadParcelDetails();
      onRefresh();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisqualify = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('parcel-workflow', {
        body: {
          action: 'disqualify',
          parcel_id: parcelId,
          user_id: user?.id,
          reason: disqualifyReason,
        },
      });

      if (error) throw error;

      toast({
        title: 'Parcel Disqualified',
        description: 'Deal closed as lost',
      });

      setDisqualifyOpen(false);
      setDisqualifyReason('');
      loadParcelDetails();
      onRefresh();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('parcels')
        .delete()
        .eq('id', parcelId);

      if (error) throw error;

      toast({
        title: 'Parcel Deleted',
        description: 'The parcel has been permanently removed',
      });

      setDeleteConfirmOpen(false);
      onOpenChange(false);
      onRefresh();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!parcel) return null;

  const getScoreColor = (score: number | null) => {
    if (!score) return 'bg-gray-100 text-gray-800';
    if (score >= 70) return 'bg-green-100 text-green-800';
    if (score >= 50) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {parcel.name || parcel.address}
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-6 mt-6">
            {/* Actions */}
            <div className="flex flex-wrap gap-2 justify-between">
              <div className="flex flex-wrap gap-2">
                {!parcel.project_id && (
                  <Button onClick={handleCreateProject} disabled={loading}>
                    <Rocket className="mr-2 h-4 w-4" />
                    Create Project Draft
                  </Button>
                )}
                {parcel.status === 'Prospecting' && (
                  <>
                    <Button onClick={checkQualifyRequirements} disabled={loading} variant="outline">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Qualify
                    </Button>
                    <Button onClick={() => setDisqualifyOpen(true)} disabled={loading} variant="destructive">
                      <XCircle className="mr-2 h-4 w-4" />
                      Disqualify
                    </Button>
                  </>
                )}
              </div>
              <Button 
                onClick={() => setDeleteConfirmOpen(true)} 
                disabled={loading} 
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <Tabs defaultValue="summary">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="utilities">Utilities</TabsTrigger>
                <TabsTrigger value="zoning">Zoning</TabsTrigger>
                <TabsTrigger value="rights">Rights</TabsTrigger>
                <TabsTrigger value="topo">Topo</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="space-y-4">
                {parcel.listing_url ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => window.open(parcel.listing_url, '_blank')}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Original Listing
                  </Button>
                ) : (
                  <div className="w-full text-center text-xs text-muted-foreground border rounded-md py-2">
                    Source link unavailable (demo)
                  </div>
                )}

                
                <Card>
                  <CardHeader>
                    <CardTitle>Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {parcel.listing_url ? (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Source:</span>
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(parcel.listing_url, '_blank');
                          }}
                        >
                          View Listing <ExternalLink className="ml-1 h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Source:</span>
                        <span className="text-xs text-muted-foreground">Link unavailable (demo)</span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge>{parcel.status}</Badge>
                    </div>
                    {parcel.best_use && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Best Use:</span>
                        <span className="font-medium">{parcel.best_use.replace('_', ' ')}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Location:</span>
                      <span className="font-medium">{parcel.city}, {parcel.state}</span>
                    </div>
                    {parcel.county && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">County:</span>
                        <span className="font-medium">{parcel.county}</span>
                      </div>
                    )}
                    {parcel.acreage && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Acreage:</span>
                        <span className="font-medium">{Number(parcel.acreage).toFixed(2)}</span>
                      </div>
                    )}
                    {parcel.apn && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">APN:</span>
                        <span className="font-medium">{parcel.apn}</span>
                      </div>
                    )}
                    {parcel.asking_price && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Asking Price:</span>
                        <span className="font-semibold text-primary">
                          ${(Number(parcel.asking_price) / 1000000).toFixed(2)}M
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Scores</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {parcel.score_data_center !== null && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Data Center Score:</span>
                        <Badge className={getScoreColor(parcel.score_data_center)}>
                          {parcel.score_data_center.toFixed(0)}
                        </Badge>
                      </div>
                    )}
                    {parcel.score_luxury !== null && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Luxury Score:</span>
                        <Badge className={getScoreColor(parcel.score_luxury)}>
                          {parcel.score_luxury.toFixed(0)}
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {parcel.project && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Linked Records</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Project:</span>
                        <span className="font-medium">{parcel.project.name}</span>
                      </div>
                      {parcel.deal && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Deal:</span>
                            <span className="font-medium">{parcel.deal.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Deal Stage:</span>
                            <Badge>{parcel.deal.stage}</Badge>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                )}

                {parcel.prospect_notes && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm whitespace-pre-wrap">{parcel.prospect_notes}</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="utilities" className="space-y-4">
                {utilities ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        Utilities
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {utilities.grid_operator && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Grid Operator:</span>
                          <span className="font-medium">{utilities.grid_operator}</span>
                        </div>
                      )}
                      {utilities.nearest_substation_name && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Nearest Substation:</span>
                          <span className="font-medium">{utilities.nearest_substation_name}</span>
                        </div>
                      )}
                      {utilities.nearest_substation_distance_mi && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Distance:</span>
                          <span className="font-medium">{utilities.nearest_substation_distance_mi} mi</span>
                        </div>
                      )}
                      {utilities.available_mw_estimate && (
                        <div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Available MW:</span>
                            <span className="font-semibold text-primary">{utilities.available_mw_estimate} MW</span>
                          </div>
                          {utilities.available_mw_confidence && (
                            <p className="text-xs text-muted-foreground mt-1">
                              ({utilities.available_mw_confidence}, {utilities.available_mw_source || 'unknown source'})
                            </p>
                          )}
                        </div>
                      )}
                      {utilities.nearest_substation_distance_mi && utilities.nearest_substation_name && (
                        <div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Substation Distance:</span>
                            <span className="font-medium">{utilities.nearest_substation_distance_mi} mi</span>
                          </div>
                        </div>
                      )}
                      {utilities.throttling_risk && (
                        <div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Throttling Risk:</span>
                            <Badge variant={utilities.throttling_risk === 'high' ? 'destructive' : 'secondary'}>
                              {utilities.throttling_risk}
                            </Badge>
                          </div>
                          {utilities.throttling_confidence && (
                            <p className="text-xs text-muted-foreground mt-1">
                              ({utilities.throttling_confidence}, {utilities.throttling_source || 'unknown source'})
                            </p>
                          )}
                        </div>
                      )}
                      {utilities.gas_batteries_allowed !== null && (
                        <div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Gas/Batteries:</span>
                            <Badge variant={utilities.gas_batteries_allowed ? 'default' : 'secondary'}>
                              {utilities.gas_batteries_allowed ? 'Allowed' : 'Not Allowed'}
                            </Badge>
                          </div>
                          {utilities.gas_batteries_confidence && (
                            <p className="text-xs text-muted-foreground mt-1">
                              ({utilities.gas_batteries_confidence}, {utilities.gas_batteries_source || 'unknown source'})
                            </p>
                          )}
                        </div>
                      )}
                      {utilities.water_provider && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Water:</span>
                          <span className="font-medium">{utilities.water_provider}</span>
                        </div>
                      )}
                      {utilities.gas_provider && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Gas:</span>
                          <span className="font-medium">{utilities.gas_provider}</span>
                        </div>
                      )}
                      {utilities.fiber_provider && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Fiber:</span>
                          <span className="font-medium">{utilities.fiber_provider}</span>
                        </div>
                      )}
                      {utilities.notes && (
                        <div className="pt-2 border-t">
                          <p className="text-sm text-muted-foreground">{utilities.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <p className="text-muted-foreground">No utility data available</p>
                )}
              </TabsContent>

              <TabsContent value="zoning" className="space-y-4">
                {zoning ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Zoning
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {zoning.zoning_type && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Type:</span>
                          <span className="font-medium">{zoning.zoning_type}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Residential:</span>
                        <Badge variant={zoning.residential_allowed ? 'default' : 'secondary'}>
                          {zoning.residential_allowed ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Commercial:</span>
                        <Badge variant={zoning.commercial_allowed ? 'default' : 'secondary'}>
                          {zoning.commercial_allowed ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Data Center:</span>
                        <Badge variant={zoning.data_center_allowed ? 'default' : 'secondary'}>
                          {zoning.data_center_allowed ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                      {zoning.entitlement_speed && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Entitlement Speed:</span>
                          <span className="font-medium">{zoning.entitlement_speed}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <p className="text-muted-foreground">No zoning data available</p>
                )}
              </TabsContent>

              <TabsContent value="rights" className="space-y-4">
                {rights ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Rights & Restrictions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {rights.mineral_rights_owner && (
                        <div>
                          <div>
                            <span className="text-muted-foreground">Mineral Rights:</span>
                            <p className="font-medium">{rights.mineral_rights_owner}</p>
                          </div>
                          {rights.mineral_rights_confidence && (
                            <p className="text-xs text-muted-foreground mt-1">
                              ({rights.mineral_rights_confidence}, {rights.mineral_rights_source || 'unknown source'})
                            </p>
                          )}
                          {rights.mineral_rights_evidence && (
                            <p className="text-xs text-muted-foreground mt-1 italic">
                              {rights.mineral_rights_evidence}
                            </p>
                          )}
                        </div>
                      )}
                      {rights.easements && (
                        <div>
                          <span className="text-muted-foreground">Easements:</span>
                          <p className="font-medium">{rights.easements}</p>
                        </div>
                      )}
                      {rights.restrictions && (
                        <div>
                          <span className="text-muted-foreground">Restrictions:</span>
                          <p className="font-medium">{rights.restrictions}</p>
                        </div>
                      )}
                      {rights.notes && (
                        <div className="pt-2 border-t">
                          <p className="text-sm text-muted-foreground">{rights.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <p className="text-muted-foreground">No rights data available</p>
                )}
              </TabsContent>

              <TabsContent value="topo" className="space-y-4">
                {topography ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Mountain className="h-4 w-4" />
                        Topography
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {topography.elevation_ft && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Elevation:</span>
                          <span className="font-medium">{topography.elevation_ft} ft</span>
                        </div>
                      )}
                      {topography.slope_pct && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Slope:</span>
                          <span className="font-medium">{topography.slope_pct}%</span>
                        </div>
                      )}
                      {topography.road_access_score && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Road Access:</span>
                          <span className="font-medium">{topography.road_access_score}/10</span>
                        </div>
                      )}
                      {topography.view_quality_score && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">View Quality:</span>
                          <span className="font-medium">{topography.view_quality_score}/10</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <p className="text-muted-foreground">No topography data available</p>
                )}
              </TabsContent>

              <TabsContent value="notes">
                <Notes 
                  relatedType="Parcel" 
                  relatedId={parcelId!} 
                  title="Team Notes"
                />
              </TabsContent>
            </Tabs>
          </div>
        </SheetContent>
      </Sheet>

      {/* Qualify Confirmation Modal */}
      <Dialog open={qualifyConfirmOpen} onOpenChange={setQualifyConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Qualification</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This parcel is marked as Data Center use but does not have a confirmed MW value.
            </p>
            <p className="text-sm font-medium">
              Are you sure you want to proceed with qualification?
            </p>
            <p className="text-xs text-muted-foreground">
              A task will be automatically created to request utility confirmation.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setQualifyConfirmOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleQualify} disabled={loading}>
                Proceed
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={disqualifyOpen} onOpenChange={setDisqualifyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disqualify Parcel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Reason for disqualification..."
              value={disqualifyReason}
              onChange={(e) => setDisqualifyReason(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDisqualifyOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDisqualify} disabled={loading}>
                Disqualify
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this parcel and all related data (utilities, zoning, rights, topography, images, and notes). This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Parcel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
