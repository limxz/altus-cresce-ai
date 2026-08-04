import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const db = supabase as any;

const today = () => new Date().toISOString().split("T")[0];
const nowLocal = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

const num = (v: string) => (v.trim() === "" ? null : Number(v));

interface Props {
  clientId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

const AddMetricsModal = ({ clientId, open, onOpenChange, onSaved }: Props) => {
  const [saving, setSaving] = useState(false);

  const [ig, setIg] = useState({
    date: today(),
    followers_count: "",
    followers_gained: "",
    reach: "",
    engagement_rate: "",
    profile_visits: "",
    website_clicks: "",
  });

  const [post, setPost] = useState({
    posted_at: nowLocal(),
    post_type: "reel",
    script_structure: "",
    reach: "",
    likes: "",
    comments: "",
    saves: "",
    shares: "",
  });

  const [ad, setAd] = useState({
    date: today(),
    spend: "",
    impressions: "",
    clicks: "",
    messages_started: "",
    conversions: "",
  });

  const finish = (error: any) => {
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao guardar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Métricas guardadas" });
    onSaved();
    onOpenChange(false);
  };

  const saveInstagram = async () => {
    setSaving(true);
    const { error } = await db.from("instagram_metrics").upsert(
      {
        client_id: clientId,
        date: ig.date,
        followers_count: num(ig.followers_count),
        followers_gained: num(ig.followers_gained),
        reach: num(ig.reach),
        engagement_rate: num(ig.engagement_rate),
        profile_visits: num(ig.profile_visits),
        website_clicks: num(ig.website_clicks),
      },
      { onConflict: "client_id,date" },
    );
    finish(error);
  };

  const savePost = async () => {
    setSaving(true);
    const { error } = await db.from("post_metrics").insert({
      client_id: clientId,
      posted_at: new Date(post.posted_at).toISOString(),
      post_type: post.post_type,
      script_structure: post.script_structure || null,
      reach: num(post.reach),
      likes: num(post.likes),
      comments: num(post.comments),
      saves: num(post.saves),
      shares: num(post.shares),
    });
    finish(error);
  };

  const saveAds = async () => {
    setSaving(true);
    const spend = num(ad.spend);
    const messages = num(ad.messages_started);
    const conversions = num(ad.conversions);
    const { error } = await db.from("ad_metrics").upsert(
      {
        client_id: clientId,
        date: ad.date,
        spend,
        impressions: num(ad.impressions),
        clicks: num(ad.clicks),
        messages_started: messages,
        conversions,
        cost_per_message: spend && messages ? Number((spend / messages).toFixed(2)) : null,
        cost_per_conversion: spend && conversions ? Number((spend / conversions).toFixed(2)) : null,
      },
      { onConflict: "client_id,date" },
    );
    finish(error);
  };

  const field = (
    id: string,
    label: string,
    value: string,
    onChange: (v: string) => void,
    type = "number",
    step?: string,
  ) => (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} step={step} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Adicionar métricas</DialogTitle>
          <DialogDescription>
            Introduz os dados manualmente. Instagram e anúncios são atualizados por dia.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="instagram">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="instagram">Instagram</TabsTrigger>
            <TabsTrigger value="post">Post</TabsTrigger>
            <TabsTrigger value="ads">Anúncios</TabsTrigger>
          </TabsList>

          <TabsContent value="instagram" className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              {field("ig-date", "Data", ig.date, (v) => setIg({ ...ig, date: v }), "date")}
              {field("ig-followers", "Seguidores (total)", ig.followers_count, (v) => setIg({ ...ig, followers_count: v }))}
              {field("ig-gained", "Seguidores ganhos", ig.followers_gained, (v) => setIg({ ...ig, followers_gained: v }))}
              {field("ig-reach", "Alcance", ig.reach, (v) => setIg({ ...ig, reach: v }))}
              {field("ig-er", "Engagement rate (%)", ig.engagement_rate, (v) => setIg({ ...ig, engagement_rate: v }), "number", "0.01")}
              {field("ig-visits", "Visitas ao perfil", ig.profile_visits, (v) => setIg({ ...ig, profile_visits: v }))}
              {field("ig-clicks", "Cliques no website", ig.website_clicks, (v) => setIg({ ...ig, website_clicks: v }))}
            </div>
            <Button className="w-full" onClick={saveInstagram} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar métricas de Instagram
            </Button>
          </TabsContent>

          <TabsContent value="post" className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              {field("p-date", "Publicado em", post.posted_at, (v) => setPost({ ...post, posted_at: v }), "datetime-local")}
              <div className="space-y-1.5">
                <Label>Tipo de post</Label>
                <Select value={post.post_type} onValueChange={(v) => setPost({ ...post, post_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reel">Reel</SelectItem>
                    <SelectItem value="carrossel">Carrossel</SelectItem>
                    <SelectItem value="imagem">Imagem</SelectItem>
                    <SelectItem value="story">Story</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {field("p-struct", "Estrutura do guião", post.script_structure, (v) => setPost({ ...post, script_structure: v }), "text")}
              {field("p-reach", "Alcance", post.reach, (v) => setPost({ ...post, reach: v }))}
              {field("p-likes", "Likes", post.likes, (v) => setPost({ ...post, likes: v }))}
              {field("p-comments", "Comentários", post.comments, (v) => setPost({ ...post, comments: v }))}
              {field("p-saves", "Guardados", post.saves, (v) => setPost({ ...post, saves: v }))}
              {field("p-shares", "Partilhas", post.shares, (v) => setPost({ ...post, shares: v }))}
            </div>
            <Button className="w-full" onClick={savePost} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar post
            </Button>
          </TabsContent>

          <TabsContent value="ads" className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              {field("a-date", "Data", ad.date, (v) => setAd({ ...ad, date: v }), "date")}
              {field("a-spend", "Investimento (€)", ad.spend, (v) => setAd({ ...ad, spend: v }), "number", "0.01")}
              {field("a-impr", "Impressões", ad.impressions, (v) => setAd({ ...ad, impressions: v }))}
              {field("a-clicks", "Cliques", ad.clicks, (v) => setAd({ ...ad, clicks: v }))}
              {field("a-msg", "Conversas iniciadas", ad.messages_started, (v) => setAd({ ...ad, messages_started: v }))}
              {field("a-conv", "Conversões", ad.conversions, (v) => setAd({ ...ad, conversions: v }))}
            </div>
            <Button className="w-full" onClick={saveAds} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar métricas de anúncios
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AddMetricsModal;
