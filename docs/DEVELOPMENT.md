# Reactance I Development

## V1 build order

1. Verify ESP32 and Pico pin definitions.
2. Test IR emitter → IR receiver communication.
3. Verify Pico laser control.
4. Verify LDR baseline and beam interruption thresholds.
5. Integrate OFF / ARMED_LOUD / ARMED_SILENT state logic.
6. Integrate buzzer behavior.
7. Integrate Wi-Fi and dashboard telemetry/control.
8. Integrate the notification backend.
9. Test fault cases and document results.

## Debugging rule

Change one subsystem at a time. Record the symptom, hardware state, firmware version, test conditions, result, and fix in the project documentation.
