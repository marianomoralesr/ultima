import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, Eye } from 'lucide-react';
import { Button } from '../components/ui/button';
import ImageUploadField from '../components/ImageUploadField';
import HomePageContentService, {
  HeroContent,
  InventoryHeroContent,
  CarroceriaCarouselContent,
  CTACardsContent,
  YouTubeVSLContent,
  TestimonialContent,
  BranchesContent,
  Branch,
  CarouselItem,
  CTACard
} from '../services/HomePageContentService';
import { useNavigate } from 'react-router-dom';

const HomePageEditorPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'hero' | 'inventory' | 'carousel' | 'cta' | 'video' | 'testimonial' | 'branches'>('hero');

  // State for all sections
  const [hero, setHero] = useState<HeroContent | null>(null);
  const [inventoryHero, setInventoryHero] = useState<InventoryHeroContent | null>(null);
  const [carroceriaCarousel, setCarroceriaCarousel] = useState<CarroceriaCarouselContent | null>(null);
  const [ctaCards, setCtaCards] = useState<CTACardsContent | null>(null);
  const [youtubeVSL, setYoutubeVSL] = useState<YouTubeVSLContent | null>(null);
  const [testimonial, setTestimonial] = useState<TestimonialContent | null>(null);
  const [branches, setBranches] = useState<BranchesContent | null>(null);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    setLoading(true);
    try {
      const sections = await HomePageContentService.getAllSections();
      setHero(sections.hero as HeroContent || getDefaultHero());
      setInventoryHero(sections.inventory_hero as InventoryHeroContent || getDefaultInventoryHero());
      setCarroceriaCarousel(sections.carroceria_carousel as CarroceriaCarouselContent || getDefaultCarousel());
      setCtaCards(sections.cta_cards as CTACardsContent || getDefaultCTACards());
      setYoutubeVSL(sections.youtube_vsl as YouTubeVSLContent || getDefaultYoutubeVSL());
      setTestimonial(sections.testimonial as TestimonialContent || getDefaultTestimonial());
      setBranches(sections.branches as BranchesContent || getDefaultBranches());
    } catch (error) {
      console.error('Error loading homepage content:', error);
      alert('Error al cargar el contenido');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (hero) await HomePageContentService.upsertSection('hero', hero);
      if (inventoryHero) await HomePageContentService.upsertSection('inventory_hero', inventoryHero);
      if (carroceriaCarousel) await HomePageContentService.upsertSection('carroceria_carousel', carroceriaCarousel);
      if (ctaCards) await HomePageContentService.upsertSection('cta_cards', ctaCards);
      if (youtubeVSL) await HomePageContentService.upsertSection('youtube_vsl', youtubeVSL);
      if (testimonial) await HomePageContentService.upsertSection('testimonial', testimonial);
      if (branches) await HomePageContentService.upsertSection('branches', branches);

      alert('Contenido guardado exitosamente');
    } catch (error) {
      console.error('Error saving content:', error);
      alert('Error al guardar el contenido');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Editor de Página de Inicio</h1>
              <p className="text-sm text-slate-600">Edita el contenido de la homepage sin redeployar</p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                className="flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Vista Previa
              </Button>
              <Button
                variant="outline"
                onClick={loadContent}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Recargar
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-4 overflow-x-auto">
            {[
              { id: 'hero' as const, label: 'Hero Principal' },
              { id: 'inventory' as const, label: 'Inventario' },
              { id: 'carousel' as const, label: 'Carrocería' },
              { id: 'cta' as const, label: 'Tarjetas CTA' },
              { id: 'video' as const, label: 'Video YouTube' },
              { id: 'branches' as const, label: 'Sucursales' },
              { id: 'testimonial' as const, label: 'Testimonial' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-4 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          {activeTab === 'hero' && hero && <HeroEditor content={hero} onChange={setHero} />}
          {activeTab === 'inventory' && inventoryHero && <InventoryHeroEditor content={inventoryHero} onChange={setInventoryHero} />}
          {activeTab === 'carousel' && carroceriaCarousel && <CarouselEditor content={carroceriaCarousel} onChange={setCarroceriaCarousel} />}
          {activeTab === 'cta' && ctaCards && <CTACardsEditor content={ctaCards} onChange={setCtaCards} />}
          {activeTab === 'video' && youtubeVSL && <YouTubeVSLEditor content={youtubeVSL} onChange={setYoutubeVSL} />}
          {activeTab === 'branches' && branches && <BranchesEditor content={branches} onChange={setBranches} />}
          {activeTab === 'testimonial' && testimonial && <TestimonialEditor content={testimonial} onChange={setTestimonial} />}
        </div>
      </div>
    </div>
  );
};

// Individual section editors
const HeroEditor: React.FC<{ content: HeroContent; onChange: (content: HeroContent) => void }> = ({ content, onChange }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-900 mb-4">Hero Principal</h2>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Texto del Badge</label>
        <input
          type="text"
          value={content.badgeText}
          onChange={(e) => onChange({ ...content, badgeText: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Título Principal</label>
        <input
          type="text"
          value={content.title}
          onChange={(e) => onChange({ ...content, title: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
        <textarea
          value={content.description}
          onChange={(e) => onChange({ ...content, description: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ImageUploadField
          label="Imagen Desktop Izquierda"
          value={content.desktopImageLeft}
          onChange={(url) => onChange({ ...content, desktopImageLeft: url })}
        />
        <ImageUploadField
          label="Imagen Desktop Derecha"
          value={content.desktopImageRight}
          onChange={(url) => onChange({ ...content, desktopImageRight: url })}
        />
      </div>

      <ImageUploadField
        label="Imagen Móvil"
        value={content.mobileImage}
        onChange={(url) => onChange({ ...content, mobileImage: url })}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Botón Primario - Texto</label>
          <input
            type="text"
            value={content.primaryButtonText}
            onChange={(e) => onChange({ ...content, primaryButtonText: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Botón Primario - Link</label>
          <input
            type="text"
            value={content.primaryButtonLink}
            onChange={(e) => onChange({ ...content, primaryButtonLink: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Botón Secundario - Texto</label>
          <input
            type="text"
            value={content.secondaryButtonText}
            onChange={(e) => onChange({ ...content, secondaryButtonText: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Botón Secundario - Link</label>
          <input
            type="text"
            value={content.secondaryButtonLink}
            onChange={(e) => onChange({ ...content, secondaryButtonLink: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Texto de Estadísticas</label>
        <input
          type="text"
          value={content.statsText}
          onChange={(e) => onChange({ ...content, statsText: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Texto de Marcas</label>
        <input
          type="text"
          value={content.brandsText}
          onChange={(e) => onChange({ ...content, brandsText: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>
    </div>
  );
};

const InventoryHeroEditor: React.FC<{ content: InventoryHeroContent; onChange: (content: InventoryHeroContent) => void }> = ({ content, onChange }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-900 mb-4">Sección de Inventario</h2>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Título</label>
        <input
          type="text"
          value={content.title}
          onChange={(e) => onChange({ ...content, title: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Subtítulo</label>
        <textarea
          value={content.subtitle}
          onChange={(e) => onChange({ ...content, subtitle: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Texto del Botón</label>
          <input
            type="text"
            value={content.buttonText}
            onChange={(e) => onChange({ ...content, buttonText: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Link del Botón</label>
          <input
            type="text"
            value={content.buttonLink}
            onChange={(e) => onChange({ ...content, buttonLink: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>
    </div>
  );
};

const CarouselEditor: React.FC<{ content: CarroceriaCarouselContent; onChange: (content: CarroceriaCarouselContent) => void }> = ({ content, onChange }) => {
  const updateItem = (index: number, item: CarouselItem) => {
    const newItems = [...content.items];
    newItems[index] = item;
    onChange({ ...content, items: newItems });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-900 mb-4">Carrusel de Carrocería</h2>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Título</label>
        <input
          type="text"
          value={content.title}
          onChange={(e) => onChange({ ...content, title: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Subtítulo</label>
        <textarea
          value={content.subtitle}
          onChange={(e) => onChange({ ...content, subtitle: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div className="space-y-6 mt-6">
        <h3 className="text-lg font-semibold text-slate-800">Items del Carrusel</h3>
        {content.items.map((item, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <h4 className="font-medium text-slate-900 mb-4">Item {index + 1}: {item.title}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Título</label>
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => updateItem(index, { ...item, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
                <input
                  type="text"
                  value={item.category}
                  onChange={(e) => updateItem(index, { ...item, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
                <textarea
                  value={item.description}
                  onChange={(e) => updateItem(index, { ...item, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Link</label>
                <input
                  type="text"
                  value={item.link}
                  onChange={(e) => updateItem(index, { ...item, link: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="md:col-span-2">
                <ImageUploadField
                  label="Imagen"
                  value={item.src}
                  onChange={(url) => updateItem(index, { ...item, src: url })}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const CTACardsEditor: React.FC<{ content: CTACardsContent; onChange: (content: CTACardsContent) => void }> = ({ content, onChange }) => {
  const updateCard = (index: number, card: CTACard) => {
    const newCards = [...content.cards];
    newCards[index] = card;
    onChange({ ...content, cards: newCards });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-900 mb-4">Tarjetas CTA</h2>

      {content.cards.map((card, index) => (
        <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <h4 className="font-medium text-slate-900 mb-4">
            {card.type === 'inventory' && 'Inventario'}
            {card.type === 'sell' && 'Vender Auto'}
            {card.type === 'advisor' && 'Asesor'}
            {card.type === 'financing' && 'Financiamiento'}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Título</label>
              <input
                type="text"
                value={card.title}
                onChange={(e) => updateCard(index, { ...card, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Texto del Botón</label>
              <input
                type="text"
                value={card.buttonText}
                onChange={(e) => updateCard(index, { ...card, buttonText: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
              <textarea
                value={card.description}
                onChange={(e) => updateCard(index, { ...card, description: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Link del Botón</label>
              <input
                type="text"
                value={card.buttonLink}
                onChange={(e) => updateCard(index, { ...card, buttonLink: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="md:col-span-2">
              <ImageUploadField
                label="Imagen"
                value={card.image}
                onChange={(url) => updateCard(index, { ...card, image: url })}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const YouTubeVSLEditor: React.FC<{ content: YouTubeVSLContent; onChange: (content: YouTubeVSLContent) => void }> = ({ content, onChange }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-900 mb-4">Video de YouTube</h2>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Título</label>
        <input
          type="text"
          value={content.title}
          onChange={(e) => onChange({ ...content, title: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Subtítulo</label>
        <textarea
          value={content.subtitle}
          onChange={(e) => onChange({ ...content, subtitle: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          ID del Video de YouTube
          <span className="text-xs text-gray-500 ml-2">(ej: p-nMlle-xfw de youtube.com/watch?v=p-nMlle-xfw)</span>
        </label>
        <input
          type="text"
          value={content.videoId}
          onChange={(e) => onChange({ ...content, videoId: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {content.videoId && (
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Vista Previa:</p>
          <div className="aspect-video rounded-lg overflow-hidden">
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${content.videoId}`}
              title="YouTube video preview"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
};

const BranchesEditor: React.FC<{ content: BranchesContent; onChange: (content: BranchesContent) => void }> = ({ content, onChange }) => {
  const updateBranch = (index: number, branch: Branch) => {
    const newBranches = [...content.branches];
    newBranches[index] = branch;
    onChange({ ...content, branches: newBranches });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-900 mb-4">Sucursales</h2>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Título</label>
        <input
          type="text"
          value={content.title}
          onChange={(e) => onChange({ ...content, title: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Subtítulo</label>
        <textarea
          value={content.subtitle}
          onChange={(e) => onChange({ ...content, subtitle: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Nota Inferior</label>
        <input
          type="text"
          value={content.bottomNote}
          onChange={(e) => onChange({ ...content, bottomNote: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div className="space-y-6 mt-6">
        <h3 className="text-lg font-semibold text-slate-800">Sucursales</h3>
        {content.branches.map((branch, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <h4 className="font-medium text-slate-900 mb-4">Sucursal {index + 1}: {branch.city}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ciudad</label>
                <input
                  type="text"
                  value={branch.city}
                  onChange={(e) => updateBranch(index, { ...branch, city: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
                <input
                  type="text"
                  value={branch.phone}
                  onChange={(e) => updateBranch(index, { ...branch, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="8187049079"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Dirección</label>
                <textarea
                  value={branch.address}
                  onChange={(e) => updateBranch(index, { ...branch, address: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">URL de Direcciones (Google Maps)</label>
                <input
                  type="text"
                  value={branch.directionsUrl}
                  onChange={(e) => updateBranch(index, { ...branch, directionsUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="https://www.google.com/maps/dir/?api=1&destination=..."
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">URL de Embed del Mapa</label>
                <input
                  type="text"
                  value={branch.mapUrl}
                  onChange={(e) => updateBranch(index, { ...branch, mapUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="https://www.google.com/maps/embed?pb=..."
                />
              </div>
              <div className="md:col-span-2">
                <ImageUploadField
                  label="Imagen de la Sucursal"
                  value={branch.imageUrl}
                  onChange={(url) => updateBranch(index, { ...branch, imageUrl: url })}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const TestimonialEditor: React.FC<{ content: TestimonialContent; onChange: (content: TestimonialContent) => void }> = ({ content, onChange }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-900 mb-4">Testimonial</h2>

      <ImageUploadField
        label="Imagen del Testimonial"
        value={content.image}
        onChange={(url) => onChange({ ...content, image: url })}
        helpText="Imagen horizontal que se muestra en toda la anchura de la página"
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Texto Alternativo (Alt)</label>
        <input
          type="text"
          value={content.alt}
          onChange={(e) => onChange({ ...content, alt: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="Descripción de la imagen para accesibilidad"
        />
      </div>
    </div>
  );
};

// Default content generators
const getDefaultHero = (): HeroContent => ({
  badgeText: "Autos Seminuevos Certificados",
  title: "Tu próximo auto seminuevo te está esperando",
  description: "Encuentra el auto perfecto en nuestra selección de vehículos seminuevos 2019 en adelante.",
  desktopImageLeft: "https://r2.trefa.mx/r9GDYibmXVaw8Zv93n4Bfi9TIs.png.webp",
  desktopImageRight: "https://r2.trefa.mx/Frame%2040%20(1).png",
  mobileImage: "https://r2.trefa.mx/r9GDYibmXVaw8Zv93n4Bfi9TIs.png.webp",
  primaryButtonText: "Ver Inventario",
  primaryButtonLink: "/autos",
  secondaryButtonText: "Conoce el Kit de Seguridad",
  secondaryButtonLink: "/kit-trefa",
  statsText: "Más de 5,000 autos vendidos y clientes satisfechos",
  brandsText: "y 15 de las mejores marcas más..."
});

const getDefaultInventoryHero = (): InventoryHeroContent => ({
  title: "Encuentra tu próximo auto",
  subtitle: "Explora nuestro inventario completo de seminuevos certificados",
  buttonText: "Ver el inventario completo",
  buttonLink: "/autos"
});

const getDefaultCarousel = (): CarroceriaCarouselContent => ({
  title: "Explora por Tipo de Carrocería",
  subtitle: "Encuentra el vehículo perfecto según tu estilo de vida.",
  items: [
    {
      title: "SUV",
      category: "Sport Utility Vehicle",
      src: "",
      description: "Espaciosos, versátiles y perfectos para la familia.",
      link: "/carroceria/suv"
    }
  ]
});

const getDefaultCTACards = (): CTACardsContent => ({
  cards: [
    {
      type: 'inventory',
      title: "Conoce nuestro inventario",
      description: "Autos seminuevos seleccionados cuidadosamente para ti.",
      buttonText: "Ver inventario",
      buttonLink: "/autos",
      image: ""
    },
    {
      type: 'sell',
      title: "¿Quieres vender tu auto?",
      description: "Recibe una oferta por tu auto en un proceso rápido y transparente.",
      buttonText: "Recibir una oferta",
      buttonLink: "/vender-mi-auto",
      image: ""
    },
    {
      type: 'advisor',
      title: "Hablar con un asesor",
      description: "Obtén una asesoría personalizada de un experto.",
      buttonText: "Iniciar Chat",
      buttonLink: "https://wa.me/5218187049079",
      image: ""
    },
    {
      type: 'financing',
      title: "Tramita tu crédito en línea",
      description: "Nuevo portal de financiamiento con respuesta en 24 horas o menos.",
      buttonText: "Ver autos elegibles",
      buttonLink: "/escritorio/aplicacion",
      image: ""
    }
  ]
});

const getDefaultYoutubeVSL = (): YouTubeVSLContent => ({
  title: "Conoce nuestra historia",
  subtitle: "Descubre cómo TREFA se ha convertido en la agencia líder.",
  videoId: "p-nMlle-xfw"
});

const getDefaultTestimonial = (): TestimonialContent => ({
  image: "/images/testimonio.png",
  alt: "Testimonio de cliente TREFA"
});

const getDefaultBranches = (): BranchesContent => ({
  title: "Nuestras Sucursales",
  subtitle: "Con presencia en 4 estados, nuestras sucursales ofrecen todos los servicios de compra, venta y financiamiento.",
  bottomNote: "Ofrecemos reubicación sin costo entre sucursales el mismo día",
  branches: [
    {
      city: 'Monterrey',
      phone: '8187049079',
      address: 'Aaron Sáenz Garza #1902, Local 111 (Plaza Oasis), Col. Santa María | 64650 NL',
      imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop',
      directionsUrl: 'https://www.google.com/maps/dir/?api=1&destination=Autos+TREFA+Suc.+Santa+Mar%C3%ADa,+Monterrey',
      mapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d20266.68731001804!2d-100.39056183742488!3d25.678753949794295!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x86629701ae2b5ea9%3A0xdf7cc5199ffd3661!2sAutos+TREFA!5e0!3m2!1ses-419!2smx!4v1760614862872!5m2!1ses-419!2smx'
    },
    {
      city: 'Reynosa',
      phone: '8994602822',
      address: 'Boulevard Beethoven #100, Col. Narciso Mendoza | 88700, TMPS',
      imageUrl: 'https://images.unsplash.com/photo-1582407947304-fd86f028f716?q=80&w=2096&auto=format&fit=crop',
      directionsUrl: 'https://www.google.com/maps/dir/?api=1&destination=TREFA+Boulevard+Beethoven+100+Col+Narciso+Mendoza+Reynosa+Tamps',
      mapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d919409.403042456!2d-100.0018594359385!3d25.821944527038745!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x86650559b25facc9%3A0x2309737f95449f22!2sAutos%20TREFA!5e0!3m2!1ses-419!2smx!4v1760615128648!5m2!1ses-419!2smx'
    },
    {
      city: 'Guadalupe',
      phone: '8187049079',
      address: 'Hidalgo #918, Col. Paraíso | 67140 Centro de Guadalupe, NL',
      imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop',
      directionsUrl: 'https://www.google.com/maps/dir/?api=1&destination=Autos+TREFA,+Hidalgo+918+Col+Paraiso+Centro+de+Guadalupe',
      mapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3595.8161808056575!2d-100.27112402363022!3d25.67738751208222!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8662bdeb19eb72eb%3A0x65eb12ea70bc37cb!2sAutos+TREFA!5e0!3m2!1ses-419!2smx!4v1760615208138!5m2!1ses-419!2smx'
    },
    {
      city: 'Saltillo',
      phone: '8442123399',
      address: 'Blvd. Nazario Ortiz #2060, Local 132, Col 16 | Saltillo, COAH 25253',
      imageUrl: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?q=80&w=2069&auto=format&fit=crop',
      directionsUrl: 'https://www.google.com/maps/dir/?api=1&destination=TREFA+Saltillo+Blvd+Nazario+Ortiz+2060+Local+132+Col+16+Saltillo+Coah',
      mapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3602.810577905786!2d-100.99913802595996!3d25.44458312076059!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!0x86880d60393303c9%3A0x33b5413345239534!2sTrefa%20Saltillo!5e0!3m2!1ses-419!2smx!4v1709660339301!5m2!1ses-419!2smx'
    }
  ]
});

export default HomePageEditorPage;
