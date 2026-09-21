import React from 'react';
import FlightTrackerModal from '../portals/Band/FlightTrackerModal';
import { Flight } from '../../types';

export interface FlightsViewProps {
  onClose: () => void;
  flights: Flight[];
  setFlights: React.Dispatch<React.SetStateAction<Flight[]>>;
  commitFlightMutation: (flights: Flight[]) => void;
  triggerNotification: (msg: string) => void;
  addLog: (msg: string) => void;
  initialIsAdding: boolean;
  isOffline: boolean;
}

export const FlightsView: React.FC<FlightsViewProps> = ({
  onClose,
  flights,
  setFlights,
  commitFlightMutation,
  triggerNotification,
  addLog,
  initialIsAdding,
  isOffline,
}) => {
  return (
    <div className="flex-grow overflow-hidden">
      <FlightTrackerModal
        onClose={onClose}
        flights={flights}
        setFlights={setFlights}
        commitFlightMutation={commitFlightMutation}
        triggerNotification={triggerNotification}
        addLog={addLog}
        initialIsAdding={initialIsAdding}
        isOffline={isOffline}
      />
    </div>
  );
};

export default FlightsView;
