import React, { useState } from 'react';
import { Truck, Plus, Edit3, Trash2, Phone, ShieldCheck, Zap, Users, Box, Save, CheckCircle2, RefreshCw, X, AlertTriangle } from 'lucide-react';
import { TourVehicle, TourPackageBand } from '../../../../lib/tourPackageManager';

interface VehiclesTabProps {
  vehicles: TourVehicle[];
  bands: TourPackageBand[];
  onAddVehicle: (vehicle: Omit<TourVehicle, 'id'>) => void;
  onUpdateVehicle: (vehicle: TourVehicle) => void;
  onDeleteVehicle: (id: string, name: string) => void;
  onSaveProgress?: () => void;
  isSaving?: boolean;
  hasUnsavedChanges?: boolean;
  lastSavedAt?: Date | null;
}

export const VehiclesTab: React.FC<VehiclesTabProps> = ({
  vehicles,
  bands,
  onAddVehicle,
  onUpdateVehicle,
  onDeleteVehicle,
  onSaveProgress,
  isSaving,
  hasUnsavedChanges,
  lastSavedAt
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<TourVehicle | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState<TourVehicle['type']>('sprinter');
  const [licensePlate, setLicensePlate] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [selectedBandNames, setSelectedBandNames] = useState<string[]>([]);
  const [capacityPax, setCapacityPax] = useState<number>(8);
  const [cargoNotes, setCargoNotes] = useState('');
  const [shorePowerReq, setShorePowerReq] = useState('');
  const [status, setStatus] = useState<TourVehicle['status']>('active');
  const [notes, setNotes] = useState('');

  const openAddModal = () => {
    setName('');
    setType('sprinter');
    setLicensePlate('');
    setDriverName('');
    setDriverPhone('');
    setSelectedBandNames(bands.map(b => b.name));
    setCapacityPax(8);
    setCargoNotes('Rear cargo compartment with gear locks');
    setShorePowerReq('15A 110V Standard Hookup');
    setStatus('active');
    setNotes('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (veh: TourVehicle) => {
    setEditingVehicle(veh);
    setName(veh.name);
    setType(veh.type);
    setLicensePlate(veh.licensePlate || '');
    setDriverName(veh.driverName || '');
    setDriverPhone(veh.driverPhone || '');
    setSelectedBandNames(veh.assignedBands || []);
    setCapacityPax(veh.capacityPax || 0);
    setCargoNotes(veh.cargoNotes || '');
    setShorePowerReq(veh.shorePowerReq || '');
    setStatus(veh.status || 'active');
    setNotes(veh.notes || '');
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingVehicle) {
      onUpdateVehicle({
        ...editingVehicle,
        name: name.trim(),
        type,
        licensePlate: licensePlate.trim() || undefined,
        driverName: driverName.trim() || undefined,
        driverPhone: driverPhone.trim() || undefined,
        assignedBands: selectedBandNames,
        capacityPax: Number(capacityPax) || 0,
        cargoNotes: cargoNotes.trim() || undefined,
        shorePowerReq: shorePowerReq.trim() || undefined,
        status,
        notes: notes.trim() || undefined
      });
      setEditingVehicle(null);
    } else {
      onAddVehicle({
        name: name.trim(),
        type,
        licensePlate: licensePlate.trim() || undefined,
        driverName: driverName.trim() || undefined,
        driverPhone: driverPhone.trim() || undefined,
        assignedBands: selectedBandNames,
        capacityPax: Number(capacityPax) || 0,
        cargoNotes: cargoNotes.trim() || undefined,
        shorePowerReq: shorePowerReq.trim() || undefined,
        status,
        notes: notes.trim() || undefined
      });
      setIsAddModalOpen(false);
    }
  };

  const toggleBandAssignment = (bName: string) => {
    setSelectedBandNames(prev =>
      prev.includes(bName) ? prev.filter(n => n !== bName) : [...prev, bName]
    );
  };

  const totalPax = vehicles.reduce((sum, v) => sum + (v.capacityPax || 0), 0);

  const getVehicleBadgeColor = (vType: TourVehicle['type']) => {
    switch (vType) {
      case 'sleeper_bus':
        return 'bg-purple-950/80 text-purple-300 border-purple-500/40';
      case 'sprinter':
        return 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40';
      case 'cargo_trailer':
        return 'bg-amber-950/80 text-amber-300 border-amber-500/40';
      case 'box_truck':
        return 'bg-rose-950/80 text-rose-300 border-rose-500/40';
      default:
        return 'bg-zinc-800 text-zinc-300 border-zinc-700';
    }
  };

  return (
    <div className="space-y-3">
      {/* Subheader */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
        <div>
          <p className="text-[11px] text-zinc-400">
            Tour convoy vehicles, sleeper berths, passenger allocations, cargo trailers, and driver contacts.
          </p>
          <div className="text-[9.5px] font-mono text-purple-400/90 pt-0.5">
            Fleet: <strong className="text-purple-300 font-bold">{vehicles.length} Vehicles</strong> • Total Bunks/Seats: <strong className="text-white font-bold">{totalPax} PAX</strong>
            {lastSavedAt && (
              <span className="text-zinc-500 ml-2">
                • Saved: {lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onSaveProgress && (
            <button
              type="button"
              onClick={onSaveProgress}
              disabled={isSaving}
              className={`px-3 py-1 rounded font-mono font-bold text-[9px] uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer shadow-sm ${
                isSaving
                  ? 'bg-amber-600/50 text-white cursor-wait'
                  : hasUnsavedChanges
                  ? 'bg-amber-500 hover:bg-amber-400 text-black font-black ring-2 ring-amber-400/50 animate-pulse'
                  : 'bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/40'
              }`}
              title="Save tour vehicle fleet (Ctrl+S / Cmd+S)"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin" /> Saving...
                </>
              ) : hasUnsavedChanges ? (
                <>
                  <Save className="w-3 h-3" /> Save Fleet *
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Fleet Saved
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={openAddModal}
            className="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white font-mono font-bold text-[9px] uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer shadow-sm"
          >
            <Plus className="w-3 h-3" /> Add Vehicle
          </button>
        </div>
      </div>

      {/* Vehicle Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {vehicles.map((veh) => {
          return (
            <div
              key={veh.id}
              className="bg-[#0e1117] border border-zinc-800 hover:border-zinc-700 rounded-xl p-3.5 space-y-3 relative overflow-hidden flex flex-col justify-between transition-all"
            >
              <div className="space-y-2">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-950/80 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0 shadow-sm">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white uppercase tracking-tight">{veh.name}</h4>
                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                        <span className={`text-[8px] font-mono font-bold px-1.5 py-0.2 rounded uppercase border ${getVehicleBadgeColor(veh.type)}`}>
                          {veh.type.replace('_', ' ')}
                        </span>
                        {veh.licensePlate && (
                          <span className="text-[8px] font-mono text-zinc-400 bg-zinc-900 px-1 py-0.2 rounded border border-zinc-800">
                            {veh.licensePlate}
                          </span>
                        )}
                        <span className={`text-[7.5px] font-mono uppercase px-1 py-0.2 rounded ${
                          veh.status === 'active' ? 'bg-emerald-950/80 text-emerald-400' : 'bg-amber-950/80 text-amber-400'
                        }`}>
                          {veh.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(veh)}
                      className="p-1 text-zinc-400 hover:text-amber-300 transition-colors cursor-pointer"
                      title="Edit Vehicle Details"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteVehicle(veh.id, veh.name)}
                      className="p-1 text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer ml-0.5"
                      title="Remove Vehicle"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Spec details */}
                <div className="space-y-1.5 pt-1 text-[10px] text-zinc-300 font-mono">
                  {veh.driverName && (
                    <div className="flex justify-between border-b border-zinc-900 pb-1">
                      <span className="text-zinc-500">Primary Driver:</span>
                      <span className="text-white truncate max-w-[150px]">{veh.driverName}</span>
                    </div>
                  )}
                  {veh.driverPhone && (
                    <div className="flex justify-between border-b border-zinc-900 pb-1">
                      <span className="text-zinc-500">Driver Phone:</span>
                      <a href={`tel:${veh.driverPhone}`} className="text-cyan-400 hover:underline flex items-center gap-1">
                        <Phone className="w-2.5 h-2.5" /> {veh.driverPhone}
                      </a>
                    </div>
                  )}
                  <div className="flex justify-between border-b border-zinc-900 pb-1">
                    <span className="text-zinc-500">Passenger Capacity:</span>
                    <span className="text-purple-300 font-bold">{veh.capacityPax || 0} Bunks / Seats</span>
                  </div>
                  {veh.shorePowerReq && (
                    <div className="flex justify-between border-b border-zinc-900 pb-1">
                      <span className="text-zinc-500">Shore Power:</span>
                      <span className="text-amber-400 flex items-center gap-0.5">
                        <Zap className="w-2.5 h-2.5" /> {veh.shorePowerReq}
                      </span>
                    </div>
                  )}
                </div>

                {/* Assigned bands */}
                <div className="bg-zinc-950 p-2 rounded border border-zinc-900 space-y-1 text-left">
                  <span className="text-[7.5px] font-mono text-zinc-400 uppercase font-bold block">Assigned Travelers / Bands:</span>
                  <div className="flex flex-wrap gap-1">
                    {veh.assignedBands && veh.assignedBands.length > 0 ? (
                      veh.assignedBands.map((bName, i) => (
                        <span key={i} className="text-[8.5px] font-mono px-1.5 py-0.2 rounded bg-purple-950/40 text-purple-300 border border-purple-500/30">
                          {bName}
                        </span>
                      ))
                    ) : (
                      <span className="text-[9px] text-zinc-500 italic">No assigned party</span>
                    )}
                  </div>
                </div>

                {/* Cargo / trailer notes */}
                {veh.cargoNotes && (
                  <div className="bg-zinc-950/60 p-2 rounded border border-zinc-900 space-y-0.5 text-left">
                    <span className="text-[7.5px] font-mono text-amber-400 uppercase font-bold block">Cargo &amp; Pack Order:</span>
                    <p className="text-[9.5px] text-zinc-400 font-sans leading-relaxed">
                      {veh.cargoNotes}
                    </p>
                  </div>
                )}
              </div>

              {veh.notes && (
                <div className="pt-1.5 border-t border-zinc-900 text-[8.5px] font-mono text-zinc-500 truncate">
                  Note: {veh.notes}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add / Edit Vehicle Modal */}
      {(isAddModalOpen || editingVehicle) && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f121a] border border-purple-500/40 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white font-mono uppercase">
                  {editingVehicle ? 'Edit Tour Vehicle Details' : 'Add Convoy Vehicle to Tour'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingVehicle(null);
                }}
                className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="p-4 space-y-3 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                <div className="sm:col-span-2">
                  <label className="text-[9px] font-mono text-zinc-400 uppercase font-bold block mb-1">
                    Vehicle Identifier / Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Lead Tour Sleeper Bus (Prevost H3)"
                    className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-mono text-zinc-400 uppercase font-bold block mb-1">
                    Vehicle Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-purple-500"
                  >
                    <option value="sleeper_bus">Sleeper Bus (Prevost / MCI)</option>
                    <option value="sprinter">Mercedes Sprinter Van</option>
                    <option value="cargo_trailer">Cargo Trailer (Dual / Single Axle)</option>
                    <option value="passenger_van">15-Passenger Van</option>
                    <option value="box_truck">Box Truck</option>
                    <option value="car">Runner Car</option>
                  </select>
                </div>

                <div>
                  <label className="text-[9px] font-mono text-zinc-400 uppercase font-bold block mb-1">
                    License Plate / State
                  </label>
                  <input
                    type="text"
                    value={licensePlate}
                    onChange={(e) => setLicensePlate(e.target.value)}
                    placeholder="e.g. OH-TOUR-88"
                    className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-mono text-zinc-400 uppercase font-bold block mb-1">
                    Primary Driver Name
                  </label>
                  <input
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="e.g. Ray Delgado"
                    className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-mono text-zinc-400 uppercase font-bold block mb-1">
                    Driver Mobile Phone
                  </label>
                  <input
                    type="text"
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                    placeholder="(555) 391-0492"
                    className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-mono text-zinc-400 uppercase font-bold block mb-1">
                    Capacity (Bunks / Seats)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={capacityPax}
                    onChange={(e) => setCapacityPax(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-mono text-zinc-400 uppercase font-bold block mb-1">
                    Shore Power Requirement
                  </label>
                  <input
                    type="text"
                    value={shorePowerReq}
                    onChange={(e) => setShorePowerReq(e.target.value)}
                    placeholder="e.g. 50A 240V Shore Power Drop"
                    className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[9px] font-mono text-zinc-400 uppercase font-bold block mb-1">
                    Assigned Package Bands (Click to toggle)
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {bands.map((b) => {
                      const isSelected = selectedBandNames.includes(b.name);
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => toggleBandAssignment(b.name)}
                          className={`px-2.5 py-1 rounded text-[9.5px] font-mono font-bold uppercase transition-all cursor-pointer border ${
                            isSelected
                              ? 'bg-purple-600 text-white border-purple-400 shadow-sm'
                              : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                          }`}
                        >
                          {isSelected ? '✓ ' : '+ '} {b.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[9px] font-mono text-zinc-400 uppercase font-bold block mb-1">
                    Cargo Bay &amp; Trailer Packing Notes
                  </label>
                  <textarea
                    rows={2}
                    value={cargoNotes}
                    onChange={(e) => setCargoNotes(e.target.value)}
                    placeholder="e.g. Row 1 = Headliner fly-rigs & cabs; Row 2 = Support cabs; Row 3 = Merch bins."
                    className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[9px] font-mono text-zinc-400 uppercase font-bold block mb-1">
                    General Notes / Hitch Info
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Tows 16ft trailer. Hitch lock code 4820."
                    className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingVehicle(null);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-xs uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-mono font-bold text-xs uppercase shadow-md cursor-pointer"
                >
                  {editingVehicle ? 'Update Vehicle' : 'Add Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
