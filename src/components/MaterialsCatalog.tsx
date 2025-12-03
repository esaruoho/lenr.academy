import { useState, useMemo } from 'react';
import { X, Search, Beaker, Factory, FlaskConical, Atom, Save, Trash2, ChevronRight, User } from 'lucide-react';
import type { Material, MaterialCategory, WeightedNuclide } from '../types';
import {
  getAllMaterials,
  searchMaterials,
  materialToWeightedNuclides,
  saveCustomMaterial,
  deleteCustomMaterial,
  createMaterialFromWeightedNuclides,
  getCustomMaterials,
} from '../services/materialsService';
import { formatProportion } from '../services/proportionService';

interface MaterialsCatalogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMaterial: (weightedNuclides: WeightedNuclide[]) => void;
  currentFuel?: WeightedNuclide[];
}

type TabKey = 'all' | 'natural-abundance' | 'alloy' | 'compound' | 'lenr-experiment' | 'custom';

const TABS: { key: TabKey; label: string; icon: typeof Atom }[] = [
  { key: 'all', label: 'All', icon: Beaker },
  { key: 'natural-abundance', label: 'Natural', icon: Atom },
  { key: 'alloy', label: 'Alloys', icon: Factory },
  { key: 'compound', label: 'Compounds', icon: FlaskConical },
  { key: 'lenr-experiment', label: 'LENR', icon: Beaker },
  { key: 'custom', label: 'Custom', icon: User },
];

/**
 * Materials Catalog Modal
 *
 * Allows users to browse and select materials from the catalog,
 * or save their current fuel mixture as a custom material.
 */
export default function MaterialsCatalog({
  isOpen,
  onClose,
  onSelectMaterial,
  currentFuel,
}: MaterialsCatalogProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveDescription, setSaveDescription] = useState('');

  // Filter materials based on tab and search
  const filteredMaterials = useMemo(() => {
    let materials = searchQuery.trim()
      ? searchMaterials(searchQuery)
      : getAllMaterials();

    if (activeTab !== 'all') {
      materials = materials.filter((m) => m.category === activeTab);
    }

    return materials;
  }, [activeTab, searchQuery]);

  // Get icon for category
  const getCategoryIcon = (category: MaterialCategory) => {
    switch (category) {
      case 'natural-abundance':
        return <Atom className="w-4 h-4" />;
      case 'alloy':
        return <Factory className="w-4 h-4" />;
      case 'compound':
        return <FlaskConical className="w-4 h-4" />;
      case 'lenr-experiment':
        return <Beaker className="w-4 h-4" />;
      case 'custom':
        return <User className="w-4 h-4" />;
    }
  };

  // Get color for category
  const getCategoryColor = (category: MaterialCategory) => {
    switch (category) {
      case 'natural-abundance':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      case 'alloy':
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
      case 'compound':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
      case 'lenr-experiment':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300';
      case 'custom':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
    }
  };

  // Handle material selection
  const handleSelect = () => {
    if (!selectedMaterial) return;
    const weightedNuclides = materialToWeightedNuclides(selectedMaterial);
    onSelectMaterial(weightedNuclides);
    onClose();
  };

  // Handle save custom material
  const handleSaveCustom = () => {
    if (!currentFuel || currentFuel.length === 0 || !saveName.trim()) return;

    const materialData = createMaterialFromWeightedNuclides(
      currentFuel,
      saveName.trim(),
      saveDescription.trim() || `Custom fuel mixture saved on ${new Date().toLocaleDateString()}`
    );

    saveCustomMaterial(materialData);
    setShowSaveDialog(false);
    setSaveName('');
    setSaveDescription('');
    // Refresh to show new material
    setActiveTab('custom');
  };

  // Handle delete custom material
  const handleDeleteCustom = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this custom material?')) {
      deleteCustomMaterial(id);
      if (selectedMaterial?.id === id) {
        setSelectedMaterial(null);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Modal Overlay */}
      <div
        data-testid="materials-catalog-overlay"
        className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal Content */}
        <div
          data-testid="materials-catalog-modal"
          className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Materials Catalog
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Select a material or save your current fuel mixture
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search and Actions */}
          <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search materials..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  data-testid="materials-search-input"
                />
              </div>
              {currentFuel && currentFuel.length > 0 && (
                <button
                  onClick={() => setShowSaveDialog(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                  data-testid="save-custom-material-button"
                >
                  <Save className="w-4 h-4" />
                  Save Current
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const count = tab.key === 'all'
                ? getAllMaterials().length
                : tab.key === 'custom'
                  ? getCustomMaterials().length
                  : getAllMaterials().filter((m) => m.category === tab.key).length;

              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`
                    flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
                    ${activeTab === tab.key
                      ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-600'
                    }
                  `}
                  data-testid={`materials-tab-${tab.key}`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  <span className="text-xs bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded-full">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Content Area */}
          <div className="flex flex-1 overflow-hidden">
            {/* Materials List */}
            <div className="w-1/2 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
              {filteredMaterials.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  {searchQuery
                    ? `No materials found for "${searchQuery}"`
                    : 'No materials in this category'}
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredMaterials.map((material) => (
                    <button
                      key={material.id}
                      onClick={() => setSelectedMaterial(material)}
                      className={`
                        w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors
                        ${selectedMaterial?.id === material.id
                          ? 'bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary-500'
                          : ''
                        }
                      `}
                      data-testid={`material-item-${material.id}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`p-1 rounded ${getCategoryColor(material.category)}`}>
                              {getCategoryIcon(material.category)}
                            </span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {material.name}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                            {material.description}
                          </p>
                          <div className="flex gap-1 mt-2">
                            {material.tags?.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {material.isCustom && (
                            <button
                              onClick={(e) => handleDeleteCustom(material.id, e)}
                              className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                              title="Delete custom material"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Material Details */}
            <div className="w-1/2 overflow-y-auto p-4">
              {selectedMaterial ? (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {selectedMaterial.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {selectedMaterial.description}
                  </p>

                  {/* Source citation */}
                  {selectedMaterial.source && (
                    <div className="mb-4">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        Source:
                      </span>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                        {selectedMaterial.source}
                      </p>
                    </div>
                  )}

                  {/* LENR experiment details */}
                  {'researcher' in selectedMaterial && (
                    <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <div className="text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Researcher:</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {(selectedMaterial as any).researcher}
                          </span>
                        </div>
                        {(selectedMaterial as any).year && (
                          <div className="flex justify-between mt-1">
                            <span className="text-gray-600 dark:text-gray-400">Year:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {(selectedMaterial as any).year}
                            </span>
                          </div>
                        )}
                        {(selectedMaterial as any).experimentType && (
                          <div className="flex justify-between mt-1">
                            <span className="text-gray-600 dark:text-gray-400">Type:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {(selectedMaterial as any).experimentType}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Composition table */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Composition ({selectedMaterial.composition.length} nuclides)
                    </h4>
                    <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-900/50 sticky top-0">
                          <tr>
                            <th className="text-left px-3 py-2 text-gray-600 dark:text-gray-400">
                              Nuclide
                            </th>
                            <th className="text-right px-3 py-2 text-gray-600 dark:text-gray-400">
                              Proportion
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {selectedMaterial.composition.map((comp) => (
                            <tr key={comp.nuclideId}>
                              <td className="px-3 py-2 font-mono text-gray-900 dark:text-white">
                                {comp.nuclideId}
                              </td>
                              <td className="px-3 py-2 text-right text-gray-600 dark:text-gray-400">
                                {formatProportion(comp.proportion)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <div className="text-center">
                    <Beaker className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Select a material to view details</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {filteredMaterials.length} materials available
            </div>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSelect}
                disabled={!selectedMaterial}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors"
                data-testid="load-material-button"
              >
                Load Material
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Save Custom Material Dialog */}
      {showSaveDialog && (
        <div
          className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4"
          onClick={() => setShowSaveDialog(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Save Custom Material
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="My Custom Fuel Mix"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  data-testid="save-material-name-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={saveDescription}
                  onChange={(e) => setSaveDescription(e.target.value)}
                  placeholder="Optional description..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                This will save your current fuel mixture ({currentFuel?.length || 0} nuclides)
                as a custom material.
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCustom}
                disabled={!saveName.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors"
                data-testid="confirm-save-material-button"
              >
                Save Material
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
