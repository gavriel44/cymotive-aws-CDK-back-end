interface Report {
  vehicleId: string;
  label: string;
  modifiedDate: string;
  manufacturerType: string;
  manufacturerTitle: string;
  signalsPerMinute: {
    infotainment: {
      canId: number;
      busId: number;
      acceptableMinValue: number;
      acceptableMaxValue: number;
      sum: number;
    };
    windows: {
      canId: number;
      busId: number;
      acceptableMinValue: number;
      acceptableMaxValue: number;
      sum: number;
    };
    airBag: {
      canId: number;
      busId: number;
      acceptableMinValue: number;
      acceptableMaxValue: number;
      sum: number;
    };
  };
}

function isReport(obj: any): obj is Report {
  if (!obj || typeof obj.vehicleId !== "string") {
    return false;
  }
  return true;
}

export { Report, isReport };
