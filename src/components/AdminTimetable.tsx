import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { GripVertical, X, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────
const ROOMS = ['101', '102', '103', '201', '202', '203', 'B1', 'B2', 'Outdoor'];

const TIME_SLOTS: string[] = [];
for (let h = 6; h < 18; h += 2) {
  const start = `${String(h).padStart(2, '0')}:00`;
  const end = `${String(h + 2).padStart(2, '0')}:00`;
  TIME_SLOTS.push(`${start}–${end}`);
}
// ['06:00–08:00', '08:00–10:00', '10:00–12:00', '12:00–14:00', '14:00–16:00', '16:00–18:00']

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ─── Types ────────────────────────────────────────────────────────────────────
interface Group {
  id: string;
  name: string;
}

interface TimetableEntry {
  id: string;
  day_of_week: number;   // 1=Mon … 7=Sun
  time_slot: string;     // '06:00:00'
  room: string;
  group_id: string;
  group_name?: string;
}

interface ContextMenu {
  x: number;
  y: number;
  entry: TimetableEntry;
}

interface PaletteItem {
  groupId: string;
  groupName: string;
  room: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getMondayOfCurrentWeek(): Date {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function getWeekDates(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

function slotToDbTime(slotLabel: string): string {
  // '06:00–08:00' → '06:00:00'
  return slotLabel.split('–')[0] + ':00';
}

function dbTimeToSlot(dbTime: string): string {
  // '06:00:00' → find matching slot label
  const startHH = dbTime.substring(0, 5);
  return TIME_SLOTS.find(s => s.startsWith(startHH)) ?? TIME_SLOTS[0];
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminTimetable() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Palette state
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [draggingPalette, setDraggingPalette] = useState<PaletteItem | null>(null);

  // Cell drag state (for reordering existing entries)
  const [draggingEntry, setDraggingEntry] = useState<TimetableEntry | null>(null);

  // Context menu
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);

  // Week navigation
  const [weekOffset, setWeekOffset] = useState(0);
  const monday = React.useMemo(() => {
    const m = getMondayOfCurrentWeek();
    m.setDate(m.getDate() + weekOffset * 7);
    return m;
  }, [weekOffset]);
  const weekDates = getWeekDates(monday);

  const contextMenuRef = useRef<HTMLDivElement>(null);

  // ── Fetch data ──────────────────────────────────────────────────────────────
  const fetchGroups = useCallback(async () => {
    const { data } = await supabase.from('groups').select('id, name').order('name');
    setGroups(data ?? []);
  }, []);

  const fetchEntries = useCallback(async () => {
    const { data } = await supabase.from('timetable').select('*');
    const mapped: TimetableEntry[] = (data ?? []).map((row: any) => ({
      id: row.id,
      day_of_week: row.day_of_week,
      time_slot: dbTimeToSlot(row.time_slot),
      room: row.room,
      group_id: Array.isArray(row.group_ids) ? row.group_ids[0] : '',
    }));
    setEntries(mapped);
  }, []);

  useEffect(() => {
    Promise.all([fetchGroups(), fetchEntries()]).finally(() => setLoading(false));
  }, [fetchGroups, fetchEntries]);

  // Enrich entries with group names
  const enrichedEntries = entries.map(e => ({
    ...e,
    group_name: groups.find(g => g.id === e.group_id)?.name ?? 'Unknown',
  }));

  // Close context menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Helpers: entry lookup ───────────────────────────────────────────────────
  function getEntriesForCell(day: number, slot: string): TimetableEntry[] {
    return enrichedEntries.filter(e => e.day_of_week === day && e.time_slot === slot);
  }

  // ── DB operations ───────────────────────────────────────────────────────────
  async function addEntry(groupId: string, room: string, day: number, slot: string) {
    const dbTime = slotToDbTime(slot);
    const { data, error } = await supabase.from('timetable').insert({
      day_of_week: day,
      time_slot: dbTime,
      room,
      group_ids: [groupId],
    }).select().single();
    if (!error && data) {
      const newEntry: TimetableEntry = {
        id: data.id,
        day_of_week: data.day_of_week,
        time_slot: dbTimeToSlot(data.time_slot),
        room: data.room,
        group_id: data.group_ids[0],
        group_name: groups.find(g => g.id === data.group_ids[0])?.name,
      };
      setEntries(prev => [...prev, newEntry]);
    }
  }

  async function updateEntryPosition(id: string, day: number, slot: string) {
    const dbTime = slotToDbTime(slot);
    const { error } = await supabase.from('timetable').update({ day_of_week: day, time_slot: dbTime }).eq('id', id);
    if (!error) {
      setEntries(prev => prev.map(e => e.id === id ? { ...e, day_of_week: day, time_slot: slot } : e));
    }
  }

  async function updateEntryRoom(id: string, room: string) {
    const { error } = await supabase.from('timetable').update({ room }).eq('id', id);
    if (!error) {
      setEntries(prev => prev.map(e => e.id === id ? { ...e, room } : e));
    }
  }

  async function updateEntryGroup(id: string, groupId: string) {
    const { error } = await supabase.from('timetable').update({ group_ids: [groupId] }).eq('id', id);
    if (!error) {
      setEntries(prev => prev.map(e => e.id === id ? { ...e, group_id: groupId } : e));
    }
  }

  async function deleteEntry(id: string) {
    const { error } = await supabase.from('timetable').delete().eq('id', id);
    if (!error) setEntries(prev => prev.filter(e => e.id !== id));
  }

  // ── Drag handlers ───────────────────────────────────────────────────────────
  function onCellDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.currentTarget.classList.add('bg-blue-50');
  }
  function onCellDragLeave(e: React.DragEvent) {
    e.currentTarget.classList.remove('bg-blue-50');
  }
  function onCellDrop(e: React.DragEvent, day: number, slot: string) {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-blue-50');
    if (draggingPalette) {
      addEntry(draggingPalette.groupId, draggingPalette.room, day, slot);
      setDraggingPalette(null);
    } else if (draggingEntry) {
      updateEntryPosition(draggingEntry.id, day, slot);
      setDraggingEntry(null);
    }
  }

  // ── Context menu ────────────────────────────────────────────────────────────
  function openContextMenu(e: React.MouseEvent, entry: TimetableEntry) {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, entry });
    setEditingEntry(null);
  }

  // ── Edit modal (inline in popup) ────────────────────────────────────────────
  const [editGroup, setEditGroup] = useState('');
  const [editRoom, setEditRoom] = useState('');

  function startEdit(entry: TimetableEntry) {
    setEditingEntry(entry);
    setEditGroup(entry.group_id);
    setEditRoom(entry.room);
    setContextMenu(null);
  }

  async function saveEdit() {
    if (!editingEntry) return;
    if (editGroup !== editingEntry.group_id) await updateEntryGroup(editingEntry.id, editGroup);
    if (editRoom !== editingEntry.room) await updateEntryRoom(editingEntry.id, editRoom);
    setEditingEntry(null);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  const paletteReady = selectedGroup && selectedRoom;

  return (
    <div className="flex flex-col gap-6">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Timetable</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Week of {formatDate(weekDates[0])} – {formatDate(weekDates[6])}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset(o => o - 1)}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setWeekOffset(0)}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => setWeekOffset(o => o + 1)}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Palette ─────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Add to Timetable — pick group + room, then drag to a cell</p>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 font-medium">Group</label>
            <select
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={selectedGroup}
              onChange={e => setSelectedGroup(e.target.value)}
            >
              <option value="">Select group…</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 font-medium">Room</label>
            <select
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={selectedRoom}
              onChange={e => setSelectedRoom(e.target.value)}
            >
              <option value="">Select room…</option>
              {ROOMS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {/* Draggable chip (only when both are selected) */}
          {paletteReady && (
            <div
              draggable
              onDragStart={() => setDraggingPalette({
                groupId: selectedGroup,
                groupName: groups.find(g => g.id === selectedGroup)?.name ?? '',
                room: selectedRoom,
              })}
              onDragEnd={() => setDraggingPalette(null)}
              className="flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-xl cursor-grab active:cursor-grabbing shadow select-none"
            >
              <GripVertical className="w-4 h-4 opacity-70" />
              <span>{groups.find(g => g.id === selectedGroup)?.name}</span>
              <span className="bg-white/20 rounded px-1.5 py-0.5 text-xs">{selectedRoom}</span>
            </div>
          )}
          {!paletteReady && (
            <div className="flex items-center gap-2 bg-gray-100 text-gray-400 text-sm font-medium px-4 py-2 rounded-xl select-none">
              <GripVertical className="w-4 h-4" />
              <span>Select group & room first</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Timetable Grid ───────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center h-64 text-gray-400">Loading…</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm bg-white">
          <table className="w-full border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {/* Time column header */}
                <th className="w-28 px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-r border-gray-200">
                  Time
                </th>
                {weekDates.map((d, i) => (
                  <th key={i} className="px-3 py-3 text-center border-r last:border-r-0 border-gray-200">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{DAY_NAMES[i]}</div>
                    <div className={`text-sm font-bold mt-0.5 ${d.toDateString() === new Date().toDateString() ? 'text-blue-600' : 'text-gray-800'}`}>{formatDate(d)}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TIME_SLOTS.map((slot, si) => (
                <tr key={slot} className={si % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}>
                  <td className="px-3 py-2 text-xs font-semibold text-gray-500 border-r border-gray-200 whitespace-nowrap align-top pt-3">
                    {slot}
                  </td>
                  {weekDates.map((_, di) => {
                    const day = di + 1;
                    const cellEntries = getEntriesForCell(day, slot);
                    return (
                      <td
                        key={di}
                        className="border-r last:border-r-0 border-gray-200 border-b last-row:border-b-0 p-1 align-top min-h-[72px] transition-colors"
                        onDragOver={onCellDragOver}
                        onDragLeave={onCellDragLeave}
                        onDrop={e => onCellDrop(e, day, slot)}
                      >
                        <div className="flex flex-col gap-1 min-h-[64px]">
                          {cellEntries.map(entry => (
                            <div
                              key={entry.id}
                              draggable
                              onDragStart={() => setDraggingEntry(entry)}
                              onDragEnd={() => setDraggingEntry(null)}
                              onClick={e => openContextMenu(e, entry)}
                              className="group relative bg-blue-50 border border-blue-200 rounded-lg px-2 py-1.5 cursor-grab active:cursor-grabbing select-none hover:bg-blue-100 transition-colors"
                            >
                              <div className="text-xs font-bold text-blue-800 leading-tight truncate">{entry.group_name}</div>
                              <div className="text-[10px] text-blue-500 font-medium mt-0.5">Room {entry.room}</div>
                              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <GripVertical className="w-3 h-3 text-blue-400" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Context Menu ─────────────────────────────────────────────────────── */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          style={{ top: contextMenu.y, left: contextMenu.x, position: 'fixed', zIndex: 9999 }}
          className="bg-white border border-gray-200 rounded-xl shadow-xl py-1 w-48 text-sm"
        >
          <button
            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-gray-700 transition-colors"
            onClick={() => startEdit(contextMenu.entry)}
          >
            <Edit2 className="w-4 h-4 text-gray-400" />
            Edit entry
          </button>
          <div className="border-t border-gray-100 my-1" />
          <button
            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 text-red-600 transition-colors"
            onClick={async () => {
              await deleteEntry(contextMenu.entry.id);
              setContextMenu(null);
            }}
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      )}

      {/* ── Edit Modal ───────────────────────────────────────────────────────── */}
      {editingEntry && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setEditingEntry(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">Edit Entry</h3>
              <button onClick={() => setEditingEntry(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Group</label>
                <select
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={editGroup}
                  onChange={e => setEditGroup(e.target.value)}
                >
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
                <select
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={editRoom}
                  onChange={e => setEditRoom(e.target.value)}
                >
                  {ROOMS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditingEntry(null)}
                className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                className="flex-1 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
