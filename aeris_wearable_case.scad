/*
================================================================================
  AERIS Wearable Prototype Node — 3D Printable Enclosure (OpenSCAD)
  
  Component Placement Layout:
  1. Main Board: ESP32 / Arduino UNO Development Node
  2. Top Surface: MAX30102 Pulse Oximeter & HR (Optical Finger Cutout Window)
  3. Bottom Surface: MAX30205 / MLX90614 Skin Temp Probe (Direct Skin Contact Port)
  4. Internal Bay: MPU6050 6-Axis IMU (Center-aligned for accurate gait acceleration)
  5. Side Walls: BME280 Environmental Node (Airflow Ventilation Grills)
  6. Side Walls: Rain Contact Sensor Probe Port
  7. Ends: Dual 20mm Wrist / Chest Band Strap Loops
  8. Rear: USB-C / Micro-USB Programming & Charging Port
================================================================================
*/

$fn = 60; // Smooth curved rendering

// -----------------------------------------------------------------------------
// Global Parametric Dimensions (in millimeters)
// -----------------------------------------------------------------------------
case_length = 78.0;   // Outer Case Length
case_width  = 52.0;   // Outer Case Width
case_height = 26.0;   // Outer Case Total Height
wall_thick  = 2.2;    // Wall Thickness
corner_r    = 6.0;    // Rounded Outer Corner Radius

// Strap Slot Dimensions
strap_width = 21.0;   // 20mm Watch/Chest Strap Width + tolerance
strap_thick = 3.5;    // Strap Pass-through Height

// Sensor Cutout Dimensions
max30102_w  = 16.0;   // Top Finger Window Width
max30102_l  = 20.0;   // Top Finger Window Length
max30205_r  = 6.5;    // Bottom Skin Contact Sensor Radius
bme280_vent_w = 1.8;  // Ventilation Slot Width
usb_cut_w   = 12.0;   // USB Port Width
usb_cut_h   = 7.0;    // USB Port Height

// -----------------------------------------------------------------------------
// Helper Modules
// -----------------------------------------------------------------------------

// Rounded Box Base
module rounded_box(l, w, h, r) {
    hull() {
        translate([r, r, 0]) cylinder(r=r, h=h);
        translate([l-r, r, 0]) cylinder(r=r, h=h);
        translate([l-r, w-r, 0]) cylinder(r=r, h=h);
        translate([r, w-r, 0]) cylinder(r=r, h=h);
    }
}

// Internal Standoff Post
module standoff(h, outer_r=3.5, inner_r=1.3) {
    difference() {
        cylinder(r=outer_r, h=h);
        translate([0, 0, -0.5])
            cylinder(r=inner_r, h=h + 1.0);
    }
}

// -----------------------------------------------------------------------------
// Main Enclosure Bottom Case
// -----------------------------------------------------------------------------
module aeris_bottom_case() {
    difference() {
        union() {
            // Main Outer Shell
            rounded_box(case_length, case_width, case_height * 0.65, corner_r);
            
            // Side Strap Mount Extended Loops
            translate([-8, (case_width - strap_width - 8)/2, 0])
                cube([10, strap_width + 8, 8]);
            translate([case_length - 2, (case_width - strap_width - 8)/2, 0])
                cube([10, strap_width + 8, 8]);
        }
        
        // Internal Hollow Cavity
        translate([wall_thick, wall_thick, wall_thick])
            rounded_box(case_length - 2*wall_thick, case_width - 2*wall_thick, case_height, corner_r - 1.0);
            
        // 1. Bottom Surface: MAX30205 Direct Skin Temperature Sensor Port
        translate([case_length/2, case_width/2, -1])
            cylinder(r=max30205_r, h=wall_thick + 2);
            
        // 2. Left Side Strap Pass-through Slot
        translate([-10, (case_width - strap_width)/2, 2])
            cube([14, strap_width, strap_thick]);
            
        // 3. Right Side Strap Pass-through Slot
        translate([case_length - 4, (case_width - strap_width)/2, 2])
            cube([14, strap_width, strap_thick]);
            
        // 4. BME280 Environmental Airflow Vent Grills (Left Wall)
        for (i = [0:4]) {
            translate([18 + i*5, -1, 6])
                cube([bme280_vent_w, wall_thick + 2, 9]);
        }
        
        // 5. Rain Sensor Contact Probe Cutout (Right Wall)
        translate([18, case_width - wall_thick - 1, 8])
            cube([22, wall_thick + 2, 5]);
            
        // 6. USB Charging & Serial Programming Cutout (Rear)
        translate([case_length - wall_thick - 1, case_width/2 - usb_cut_w/2, 5])
            cube([wall_thick + 4, usb_cut_w, usb_cut_h]);
    }
    
    // Internal Mounting Standoffs for ESP32 & MPU6050 Boards
    translate([14, 12, wall_thick]) standoff(5);
    translate([14, case_width - 12, wall_thick]) standoff(5);
    translate([case_length - 16, 12, wall_thick]) standoff(5);
    translate([case_length - 16, case_width - 12, wall_thick]) standoff(5);
}

// -----------------------------------------------------------------------------
// Main Enclosure Top Cover Lid (Snap-Fit / Screw Lid)
// -----------------------------------------------------------------------------
module aeris_top_lid() {
    translate([0, case_width + 15, 0]) {
        difference() {
            union() {
                // Top Cover Plate
                rounded_box(case_length, case_width, wall_thick + 1.5, corner_r);
                
                // Inner Aligning Rim
                translate([wall_thick + 0.3, wall_thick + 0.3, wall_thick])
                    rounded_box(case_length - 2*wall_thick - 0.6, case_width - 2*wall_thick - 0.6, 2.5, corner_r - 1.2);
            }
            
            // Hollow inner aligning rim
            translate([wall_thick + 1.8, wall_thick + 1.8, wall_thick - 0.1])
                rounded_box(case_length - 2*wall_thick - 3.6, case_width - 2*wall_thick - 3.6, 4, corner_r - 2.0);
                
            // 1. MAX30102 Top Optical Pulse Oximeter Finger Window
            translate([case_length/2 - max30102_l/2, case_width/2 - max30302_w/2 - 2, -1])
                cube([max30102_l, max30102_w, wall_thick + 4]);
                
            // 2. Status LED Indicator Light Guide Hole
            translate([case_length/2 + max30102_l/2 + 8, case_width/2, -1])
                cylinder(r=1.6, h=wall_thick + 4);
        }
    }
}

// -----------------------------------------------------------------------------
// Render Both Case Sections (Bottom Body + Top Lid)
// -----------------------------------------------------------------------------
max30302_w = max30102_w;

color("DeepSkyBlue") aeris_bottom_case();
color("DarkSlateGray") aeris_top_lid();
