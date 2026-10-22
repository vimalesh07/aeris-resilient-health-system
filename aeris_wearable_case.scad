/*
================================================================================
  AERIS NEXT-GEN WEARABLE HEALTH WATCH ENCLOSURE
  High-Precision Parametric CAD Model (OpenSCAD)
  
  Styling:
  - Dual-Tone High-Contrast Aesthetic
  - Pristine Alpine White Top Bezel Body
  - Midnight Black Chamfered Protective Edge Lining & Outer Border Rings
  - Smoked Obsidian OLED Bezel with Cyan Screen Matrix Simulation
  - Matte Graphite Black Wrist-Contact Sensor Chassis
  
  Component Hardware Integration:
  1. Top: SSD1306 0.96" OLED Display (128x64) with Recessed Viewing Window
  2. Bottom: MAX30102 PPG Optical Heart Rate & SpO2 Sensor Aperture
  3. Right Flank: Ergonomic Tactile SOS Emergency Button with Protective Collar
  4. Left Flank: Precision Acoustic Resonator Grille for Piezo Buzzer
  5. Top & Bottom: Dual 20mm Standard Watch Strap Lug Spring-Bar Channels
  6. Internal: 4x M2 Corner Fastener Alignment Bosses & Snap-Lock Tongue
================================================================================
*/

$fn = 60; // Ultra-smooth curves for 3D printing & rendering

// =============================================================================
// VIEW SELECTION SELECTOR:
// Set "assembled" for the complete dual-tone beauty render
// Set "exploded" to inspect the layer assembly
// Set "top_white" to export only the White Top Bezel STL
// Set "edges_black" to export only the Black Outer Edge Lining STL
// Set "bottom_case" to export only the Bottom Sensor Case STL
// Set "sos_button" to export only the SOS Button Cap STL
// =============================================================================
RENDER_MODE = "assembled"; // ["assembled", "exploded", "top_white", "edges_black", "bottom_case", "sos_button"]

// =============================================================================
// GLOBAL PARAMETRIC DIMENSIONS (Millimeters)
// =============================================================================
watch_length = 48.0;   // Outer chassis length (Y-axis)
watch_width  = 44.0;   // Outer chassis width (X-axis)
watch_height = 14.2;   // Total assembled watch thickness (Z-axis)
wall_thick   = 2.2;    // Structural rigidity wall thickness
corner_r     = 7.0;    // Ergonomic corner radius

// Edge Lining Accent Geometry
edge_border_w = 1.8;   // Black perimeter edge lining width
edge_chamfer  = 1.4;   // 45-degree tactical chamfer relief

// Display Cutout (0.96" I2C SSD1306 OLED)
oled_win_x   = 23.8;   // Visible display window width
oled_win_y   = 13.0;   // Visible display window height
oled_pocket_x = 27.5;  // Internal PCB pocket width
oled_pocket_y = 27.5;  // Internal PCB pocket length
oled_bezel_t = 1.0;    // Acrylic glass protector recess lip

// Bottom MAX30102 PPG Optical Sensor Aperture
sensor_dome_r = 8.0;   // Circular sensor optical window radius
sensor_recess = 1.2;   // Recessed skin cushion contact bevel

// 20mm Watch Band Lugs
strap_lug_w  = 20.4;   // Standard 20mm watch band width + tolerance
strap_lug_t  = 3.4;    // Strap pass-through thickness
lug_extend   = 6.5;    // Lug extension length from main chassis

// Tactical SOS Button (Right Wall)
button_dia   = 5.8;    // Pushbutton travel aperture diameter
button_collar_dia = 8.2; // Raised protective bezel collar

// Acoustic Buzzer Grille (Left Wall)
buzzer_hole_dia = 1.4; // Precision resonator pinholes

// Fastener Standoffs
boss_outer_r = 3.2;    // M2 boss outer radius
boss_inner_r = 1.1;    // M2 pilot hole radius (tapping screw)

// Dual-Tone Palette Definition
COLOR_WHITE_BEZEL   = [0.96, 0.96, 0.98, 1.0]; // Alpine White Top Case
COLOR_BLACK_EDGES   = [0.10, 0.10, 0.12, 1.0]; // Midnight Black Edge Lines & Lugs
COLOR_BOTTOM_CHASSIS= [0.15, 0.15, 0.18, 1.0]; // Deep Carbon Bottom Body
COLOR_OLED_GLASS    = [0.04, 0.04, 0.05, 0.95]; // Obsidian Display Matrix
COLOR_OLED_ACTIVE   = [0.00, 0.85, 0.85, 1.0]; // Cyan OLED Active Pixels
COLOR_SOS_BUTTON    = [0.85, 0.12, 0.12, 1.0]; // Emergency Crimson Accent Button

// =============================================================================
// PRIMITIVE GEOMETRY HELPERS
// =============================================================================

// High-precision smooth rounded rectangular block
module rounded_slab(l, w, h, r) {
    translate([-l/2 + r, -w/2 + r, 0])
    hull() {
        cylinder(r=r, h=h);
        translate([l - 2*r, 0, 0]) cylinder(r=r, h=h);
        translate([l - 2*r, w - 2*r, 0]) cylinder(r=r, h=h);
        translate([0, w - 2*r, 0]) cylinder(r=r, h=h);
    }
}

// 45-degree chamfered slab for luxury bevels
module chamfered_slab(l, w, h, r, c) {
    hull() {
        translate([0, 0, c])
            rounded_slab(l, w, h - c, r);
        translate([0, 0, 0])
            rounded_slab(l - 2*c, w - 2*c, c, max(0.5, r - c));
    }
}

// M2 Fastener Pillar
module screw_boss(h) {
    difference() {
        cylinder(r=boss_outer_r, h=h);
        translate([0, 0, -0.5])
            cylinder(r=boss_inner_r, h=h + 1.0);
    }
}

// =============================================================================
// MODULE 1: BLACK EDGE LINING & PROTECTIVE PERIMETER TRIM
// =============================================================================
module aeris_black_edge_trim() {
    difference() {
        // Outer Protective Perimeter Border
        chamfered_slab(watch_length, watch_width, 5.0, corner_r, edge_chamfer);
        
        // Pocket cut for the white top bezel insert
        translate([0, 0, -0.5])
            rounded_slab(watch_length - 2*edge_border_w, watch_width - 2*edge_border_w, 6.0, corner_r - edge_border_w);
            
        // Right Wall SOS Button Port
        translate([watch_length/2 - 1, 0, 2.5])
            rotate([0, 90, 0])
                cylinder(r=button_collar_dia/2, h=edge_border_w + 3);
                
        // Left Wall Acoustic Buzzer Port
        translate([-watch_length/2 - 2, 0, 2.5])
            rotate([0, 90, 0])
                cylinder(r=3.5, h=edge_border_w + 4);
    }
    
    // Top & Bottom 20mm Integrated Strap Lugs (Matte Black)
    // Top Lug (+Y)
    translate([0, watch_width/2 + lug_extend/2 - 0.5, 2.5]) {
        difference() {
            rounded_slab(strap_lug_w + 5.0, lug_extend + 1.0, 4.8, 2.0);
            // Strap pass-through channel
            translate([0, 0, -0.5])
                cube([strap_lug_w, lug_extend + 4.0, strap_lug_t], center=true);
        }
    }
    // Bottom Lug (-Y)
    translate([0, -(watch_width/2 + lug_extend/2 - 0.5), 2.5]) {
        difference() {
            rounded_slab(strap_lug_w + 5.0, lug_extend + 1.0, 4.8, 2.0);
            // Strap pass-through channel
            translate([0, 0, -0.5])
                cube([strap_lug_w, lug_extend + 4.0, strap_lug_t], center=true);
        }
    }
}

// =============================================================================
// MODULE 2: ALPINE WHITE TOP CASE BEZEL
// =============================================================================
module aeris_white_top_bezel() {
    difference() {
        union() {
            // Main White Fascia Plate
            translate([0, 0, 0.4])
                rounded_slab(watch_length - 2*edge_border_w + 0.1, watch_width - 2*edge_border_w + 0.1, 4.6, corner_r - edge_border_w);
            
            // Raised Display Bezel Frame
            translate([0, 0, 4.6])
                rounded_slab(oled_win_x + 4.0, oled_win_y + 4.0, 0.8, 1.8);
        }
        
        // 1. OLED Visible Window Cutout
        translate([0, 0, -1])
            cube([oled_win_x, oled_win_y, 8], center=true);
            
        // 2. OLED Internal Recessed Mounting Pocket (Underneath)
        translate([0, 0, -0.5])
            cube([oled_pocket_x, oled_pocket_y, 3.2], center=true);
            
        // 3. Status Micro-LED Indicator Hole (Cyan / Red Alert)
        translate([0, oled_win_y/2 + 4.2, -1])
            cylinder(r=1.0, h=7.0);
            
        // 4. Subtle Engraved AERIS Brand Logo
        translate([-11, -(oled_win_y/2 + 5.2), 4.8])
            linear_extrude(height=0.6)
                text("A E R I S", size=2.8, font="Arial:style=Bold");
                
        // 5. 4x Corner Fastener Countersink Holes
        for (dx = [-1, 1]) {
            for (dy = [-1, 1]) {
                translate([dx * (watch_length/2 - 5.5), dy * (watch_width/2 - 5.5), -1]) {
                    cylinder(r=1.2, h=7.0);      // Screw shaft
                    translate([0, 0, 4.2])
                        cylinder(r=2.2, h=2.5);  // Flush screw head pocket
                }
            }
        }
    }
}

// =============================================================================
// MODULE 3: BOTTOM SENSOR CHASSIS (Carbon Graphite)
// =============================================================================
module aeris_bottom_case() {
    difference() {
        // Outer Shell
        rounded_slab(watch_length, watch_width, 9.2, corner_r);
        
        // Internal Hollow Mainboard Cavity
        translate([0, 0, wall_thick])
            rounded_slab(watch_length - 2*wall_thick, watch_width - 2*wall_thick, 10.0, corner_r - 1.2);
            
        // 1. Bottom Wrist-Contact MAX30102 Optical Sensor Port
        translate([0, 0, -1]) {
            cylinder(r=sensor_dome_r, h=wall_thick + 2.0);
            // Outer skin-seal compression bevel
            translate([0, 0, 1.0])
                cylinder(r=sensor_dome_r + sensor_recess, h=1.5);
        }
        
        // 2. Right Side Tactical SOS Pushbutton Slot
        translate([watch_length/2 - 1, 0, 5.0])
            rotate([0, 90, 0])
                cylinder(r=button_dia/2, h=wall_thick + 4.0);
                
        // 3. Left Side Acoustic Buzzer Resonator Holes (3-Array)
        for (offset = [-3.0, 0.0, 3.0]) {
            translate([-watch_length/2 - 1, offset, 5.0])
                rotate([0, 90, 0])
                    cylinder(r=buzzer_hole_dia/2, h=wall_thick + 4.0);
        }
        
        // 4. Rear USB-C Charging / Serial Telemetry Access Port
        translate([0, watch_width/2 - wall_thick - 1, 4.2])
            cube([9.4, wall_thick + 3.0, 4.2], center=true);
            
        // 5. Interlocking Tongue Alignment Groove for Top Bezel
        translate([0, 0, 8.2])
            difference() {
                rounded_slab(watch_length - wall_thick + 0.2, watch_width - wall_thick + 0.2, 1.5, corner_r - 0.5);
                translate([0, 0, -0.5])
                    rounded_slab(watch_length - wall_thick - 1.4, watch_width - wall_thick - 1.4, 2.5, corner_r - 1.0);
            }
    }
    
    // Internal Mounting Posts for MAX30102 Sensor & Microcontroller Board
    for (dx = [-1, 1]) {
        for (dy = [-1, 1]) {
            translate([dx * (watch_length/2 - 5.5), dy * (watch_width/2 - 5.5), wall_thick])
                screw_boss(7.2);
        }
    }
    
    // MAX30102 Sensor Optical Isolation Ring (Prevents internal light bleed)
    translate([0, 0, wall_thick])
        difference() {
            cylinder(r=sensor_dome_r + 1.4, h=2.5);
            translate([0, 0, -0.5])
                cylinder(r=sensor_dome_r, h=3.5);
        }
}

// =============================================================================
// MODULE 4: TACTILE SOS BUTTON CAP
// =============================================================================
module aeris_sos_button() {
    rotate([0, 90, 0]) {
        // Outer Ergonomic Button Head
        cylinder(r=button_dia/2 - 0.2, h=3.0);
        // Tactile knurling crown
        translate([0, 0, 2.8])
            sphere(r=button_dia/2 - 0.2);
        // Internal Retaining Shoulder Collar
        translate([0, 0, -1.8])
            cylinder(r=button_collar_dia/2 - 0.4, h=1.8);
        // Internal Switch Plunger Stem
        translate([0, 0, -4.5])
            cylinder(r=1.2, h=3.0);
    }
}

// =============================================================================
// MODULE 5: OLED DISPLAY SIMULATION (Glass Lens & Active Telemetry GUI)
// =============================================================================
module aeris_oled_simulation() {
    // Obsidian Glass Substrate
    color(COLOR_OLED_GLASS)
        cube([oled_win_x - 0.2, oled_win_y - 0.2, 0.8], center=true);
        
    // Simulated Active Telemetry Pixel Graphics
    color(COLOR_OLED_ACTIVE) {
        // Live Heart Rate & SpO2 Display Readout
        translate([-oled_win_x/2 + 2, oled_win_y/2 - 3.8, 0.45])
            linear_extrude(0.1)
                text("BPM: 78", size=2.4, font="Courier:style=Bold");
                
        translate([-oled_win_x/2 + 2, oled_win_y/2 - 7.5, 0.45])
            linear_extrude(0.1)
                text("SpO2:98%", size=2.4, font="Courier:style=Bold");
                
        translate([-oled_win_x/2 + 2, -oled_win_y/2 + 1.4, 0.45])
            linear_extrude(0.1)
                text("AI:NORMAL 92%", size=1.8, font="Courier:style=Bold");
    }
}

// =============================================================================
// MAIN ASSEMBLY CONTROLLER
// =============================================================================
module render_aeris_watch() {
    if (RENDER_MODE == "assembled") {
        // 1. Bottom Carbon Chassis
        color(COLOR_BOTTOM_CHASSIS)
            aeris_bottom_case();
            
        // 2. Black Perimeter Chamfered Edge Trim
        translate([0, 0, 9.2])
            color(COLOR_BLACK_EDGES)
                aeris_black_edge_trim();
                
        // 3. Pristine Alpine White Top Bezel Plate
        translate([0, 0, 9.2])
            color(COLOR_WHITE_BEZEL)
                aeris_white_top_bezel();
                
        // 4. OLED Display with Active TinyML UI
        translate([0, 0, 13.0])
            aeris_oled_simulation();
            
        // 5. Emergency SOS Red Tactile Button
        translate([watch_length/2 + 1.2, 0, 5.0])
            color(COLOR_SOS_BUTTON)
                aeris_sos_button();
    }
    
    else if (RENDER_MODE == "exploded") {
        // Exploded View for Component Stack Inspection
        // Bottom Case
        color(COLOR_BOTTOM_CHASSIS)
            aeris_bottom_case();
            
        // Button Cap (Pulled Outward)
        translate([watch_length/2 + 10.0, 0, 5.0])
            color(COLOR_SOS_BUTTON)
                aeris_sos_button();
                
        // OLED Panel (Floating mid-air)
        translate([0, 0, 15.0])
            aeris_oled_simulation();
            
        // Black Edge Lining (Floating higher)
        translate([0, 0, 24.0])
            color(COLOR_BLACK_EDGES)
                aeris_black_edge_trim();
                
        // White Top Bezel (At the top of the stack)
        translate([0, 0, 32.0])
            color(COLOR_WHITE_BEZEL)
                aeris_white_top_bezel();
    }
    
    else if (RENDER_MODE == "top_white") {
        // Export STL: Alpine White Top Bezel
        color(COLOR_WHITE_BEZEL)
            aeris_white_top_bezel();
    }
    
    else if (RENDER_MODE == "edges_black") {
        // Export STL: Midnight Black Edge Lining & Lugs
        color(COLOR_BLACK_EDGES)
            aeris_black_edge_trim();
    }
    
    else if (RENDER_MODE == "bottom_case") {
        // Export STL: Bottom Carbon Chassis
        color(COLOR_BOTTOM_CHASSIS)
            aeris_bottom_case();
    }
    
    else if (RENDER_MODE == "sos_button") {
        // Export STL: Emergency SOS Button
        color(COLOR_SOS_BUTTON)
            aeris_sos_button();
    }
}

// Execute Render
render_aeris_watch();
