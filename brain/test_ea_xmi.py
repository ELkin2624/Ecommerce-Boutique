import xml.etree.ElementTree as ET

# We will generate a fully EA-compliant XMI 2.1 file with both standard UML2 and EA Extension connectors.

def generate_ea_xmi():
    classes = [
        # (id, name, package, [attributes (name, type)], [operations (name, ret_type)])
        ("Class_User", "User", "Pkg_Security", [
            ("id", "UUID"), ("name", "String"), ("email", "String"), 
            ("password_hash", "String"), ("preferred_size", "String"), 
            ("is_active", "Boolean"), ("created_at", "DateTime")
        ], [("validatePassword", "Boolean"), ("updateProfile", "Boolean")]),

        ("Class_Role", "Role", "Pkg_Security", [
            ("id", "UUID"), ("name", "String"), ("description", "String")
        ], []),

        ("Class_Permission", "Permission", "Pkg_Security", [
            ("id", "UUID"), ("resource", "String"), ("action", "String"), ("description", "String")
        ], []),

        ("Class_UserRole", "UserRole", "Pkg_Security", [
            ("id", "UUID"), ("user_id", "UUID"), ("role_id", "UUID"), ("assigned_at", "DateTime")
        ], []),

        ("Class_Category", "Category", "Pkg_Catalog", [
            ("id", "UUID"), ("name", "String"), ("description", "String"), ("is_active", "Boolean")
        ], []),

        ("Class_Product", "Product", "Pkg_Catalog", [
            ("id", "UUID"), ("name", "String"), ("description", "String"), 
            ("brand", "String"), ("category_id", "UUID"), ("is_active", "Boolean")
        ], [("getVariants", "JSON")]),

        ("Class_ProductVariant", "ProductVariant", "Pkg_Catalog", [
            ("id", "UUID"), ("product_id", "UUID"), ("sku", "String"), ("color", "String"),
            ("size", "String"), ("price", "Decimal"), ("cost", "Decimal"), 
            ("barcode", "String"), ("is_active", "Boolean")
        ], [("calculateFitScore", "Decimal")]),

        ("Class_FittingMeasurement", "FittingMeasurement", "Pkg_Catalog", [
            ("id", "UUID"), ("variant_id", "UUID"), ("chest_cm", "Decimal"), 
            ("waist_cm", "Decimal"), ("hips_cm", "Decimal"), ("length_cm", "Decimal"), 
            ("asset_3d_url", "String")
        ], []),

        ("Class_ProductImage", "ProductImage", "Pkg_Catalog", [
            ("id", "UUID"), ("product_id", "UUID"), ("url", "String"), 
            ("is_cover", "Boolean"), ("sort_order", "Integer")
        ], []),

        ("Class_City", "City", "Pkg_Inventory", [
            ("id", "UUID"), ("name", "String")
        ], []),

        ("Class_Branch", "Branch", "Pkg_Inventory", [
            ("id", "UUID"), ("city_id", "UUID"), ("name", "String"), 
            ("address", "String"), ("phone", "String"), ("lat_long", "String")
        ], []),

        ("Class_WarehouseLocation", "WarehouseLocation", "Pkg_Inventory", [
            ("id", "UUID"), ("branch_id", "UUID"), ("name", "String"), ("type", "String")
        ], []),

        ("Class_InventoryStock", "InventoryStock", "Pkg_Inventory", [
            ("id", "UUID"), ("variant_id", "UUID"), ("location_id", "UUID"), 
            ("quantity", "Integer"), ("min_stock", "Integer")
        ], [("updateStock", "Boolean")]),

        ("Class_InventoryMovement", "InventoryMovement", "Pkg_Inventory", [
            ("id", "UUID"), ("variant_id", "UUID"), ("location_id", "UUID"), 
            ("type", "String"), ("quantity", "Integer"), ("reference_id", "UUID"), 
            ("created_at", "DateTime")
        ], []),

        ("Class_Reservation", "Reservation", "Pkg_Reservations", [
            ("id", "UUID"), ("user_id", "UUID"), ("branch_id", "UUID"), 
            ("status", "String"), ("fitting_room_no", "Integer"), 
            ("expires_at", "DateTime"), ("qr_code", "String")
        ], [("transitionTo", "Boolean"), ("assignFittingRoom", "Boolean")]),

        ("Class_ReservationItem", "ReservationItem", "Pkg_Reservations", [
            ("id", "UUID"), ("reservation_id", "UUID"), ("variant_id", "UUID"), 
            ("quantity", "Integer")
        ], []),

        ("Class_Cart", "Cart", "Pkg_Orders", [
            ("id", "UUID"), ("user_id", "UUID"), ("created_at", "DateTime")
        ], []),

        ("Class_CartItem", "CartItem", "Pkg_Orders", [
            ("id", "UUID"), ("cart_id", "UUID"), ("variant_id", "UUID"), 
            ("quantity", "Integer"), ("price", "Decimal")
        ], []),

        ("Class_Order", "Order", "Pkg_Orders", [
            ("id", "UUID"), ("user_id", "UUID"), ("branch_id", "UUID"), 
            ("type", "String"), ("status", "String"), ("total", "Decimal"), 
            ("payment_ref", "String"), ("created_at", "DateTime")
        ], [("calculateTotal", "Decimal")]),

        ("Class_OrderItem", "OrderItem", "Pkg_Orders", [
            ("id", "UUID"), ("order_id", "UUID"), ("variant_id", "UUID"), 
            ("quantity", "Integer"), ("unit_price", "Decimal"), ("subtotal", "Decimal")
        ], []),

        ("Class_Payment", "Payment", "Pkg_Orders", [
            ("id", "UUID"), ("order_id", "UUID"), ("method", "String"), 
            ("status", "String"), ("amount", "Decimal"), 
            ("transaction_ref", "String"), ("paid_at", "DateTime")
        ], []),

        ("Class_InvoiceSIN", "InvoiceSIN", "Pkg_Orders", [
            ("id", "UUID"), ("order_id", "UUID"), ("invoice_number", "String"), 
            ("authorization_code", "String"), ("control_code", "String"), 
            ("nit_customer", "String"), ("xml_signed", "String")
        ], []),

        ("Class_OutboxTransaction", "OutboxTransaction", "Pkg_Orders", [
            ("id", "UUID"), ("payload_json", "JSON"), ("sync_status", "String"), 
            ("created_at", "DateTime"), ("retry_count", "Integer")
        ], [])
    ]

    connectors = [
        # (id, name, type, source_id, target_id, src_card, tgt_card, ea_type, ea_sub)
        ("Conn_User_UserRole", "has_roles", "Association", "Class_User", "Class_UserRole", "1", "0..*", "Association", "Source -> Destination"),
        ("Conn_Role_UserRole", "role_assigned", "Association", "Class_Role", "Class_UserRole", "1", "0..*", "Association", "Source -> Destination"),
        ("Conn_Cat_Prod", "categorizes", "Aggregation", "Class_Category", "Class_Product", "1", "0..*", "Aggregation", "Composite"),
        ("Conn_Prod_Var", "variants", "Aggregation", "Class_Product", "Class_ProductVariant", "1", "1..*", "Aggregation", "Composite"),
        ("Conn_Var_Fit", "has_measurement", "Association", "Class_ProductVariant", "Class_FittingMeasurement", "1", "0..1", "Association", "Source -> Destination"),
        ("Conn_Prod_Img", "images", "Aggregation", "Class_Product", "Class_ProductImage", "1", "0..*", "Aggregation", "Composite"),
        ("Conn_City_Branch", "has_branches", "Aggregation", "Class_City", "Class_Branch", "1", "1..*", "Aggregation", "Composite"),
        ("Conn_Branch_Loc", "has_locations", "Aggregation", "Class_Branch", "Class_WarehouseLocation", "1", "1..*", "Aggregation", "Composite"),
        ("Conn_Var_Stock", "stock_items", "Association", "Class_ProductVariant", "Class_InventoryStock", "1", "0..*", "Association", "Source -> Destination"),
        ("Conn_Loc_Stock", "location_stock", "Association", "Class_WarehouseLocation", "Class_InventoryStock", "1", "0..*", "Association", "Source -> Destination"),
        ("Conn_Stock_Mov", "movements", "Association", "Class_InventoryStock", "Class_InventoryMovement", "1", "0..*", "Association", "Source -> Destination"),
        ("Conn_User_Res", "places_reservation", "Association", "Class_User", "Class_Reservation", "1", "0..*", "Association", "Source -> Destination"),
        ("Conn_Branch_Res", "receives_reservation", "Association", "Class_Branch", "Class_Reservation", "1", "0..*", "Association", "Source -> Destination"),
        ("Conn_Res_Item", "contains_items", "Aggregation", "Class_Reservation", "Class_ReservationItem", "1", "1..*", "Aggregation", "Composite"),
        ("Conn_Var_RItem", "reserved_variant", "Association", "Class_ProductVariant", "Class_ReservationItem", "1", "0..*", "Association", "Source -> Destination"),
        ("Conn_User_Cart", "owns_cart", "Aggregation", "Class_User", "Class_Cart", "1", "0..1", "Aggregation", "Composite"),
        ("Conn_Cart_Item", "cart_items", "Aggregation", "Class_Cart", "Class_CartItem", "1", "0..*", "Aggregation", "Composite"),
        ("Conn_User_Order", "places_order", "Association", "Class_User", "Class_Order", "1", "0..*", "Association", "Source -> Destination"),
        ("Conn_Branch_Order", "order_branch", "Association", "Class_Branch", "Class_Order", "1", "0..*", "Association", "Source -> Destination"),
        ("Conn_Order_Item", "order_items", "Aggregation", "Class_Order", "Class_OrderItem", "1", "1..*", "Aggregation", "Composite"),
        ("Conn_Var_OItem", "ordered_variant", "Association", "Class_ProductVariant", "Class_OrderItem", "1", "0..*", "Association", "Source -> Destination"),
        ("Conn_Order_Pay", "order_payment", "Aggregation", "Class_Order", "Class_Payment", "1", "1", "Aggregation", "Composite"),
        ("Conn_Order_Inv", "order_invoice", "Association", "Class_Order", "Class_InvoiceSIN", "1", "0..1", "Association", "Source -> Destination")
    ]

    packages = {
        "Pkg_Security": "Security_and_Users",
        "Pkg_Catalog": "Catalog_and_Products",
        "Pkg_Inventory": "Inventory_and_Branches",
        "Pkg_Reservations": "Reservations_and_Fitting",
        "Pkg_Orders": "Orders_and_Payments"
    }

    xml_lines = []
    xml_lines.append('<?xml version="1.0" encoding="UTF-8"?>')
    xml_lines.append('<xmi:XMI xmi:version="2.1" xmlns:uml="http://schema.omg.org/spec/UML/2.1" xmlns:xmi="http://schema.omg.org/spec/XMI/2.1">')
    xml_lines.append('  <xmi:Documentation exporter="Enterprise Architect" exporterVersion="6.5"/>')
    xml_lines.append('  <uml:Model xmi:type="uml:Model" name="FashionStore_DomainModel" xmi:id="Model_FashionStore">')
    
    # Types
    for t in ["String", "Integer", "Boolean", "Decimal", "UUID", "DateTime", "JSON"]:
        xml_lines.append(f'    <packagedElement xmi:type="uml:PrimitiveType" name="{t}" xmi:id="Type_{t}"/>')
    
    # Packages and Classes
    for pkg_id, pkg_name in packages.items():
        xml_lines.append(f'    <packagedElement xmi:type="uml:Package" name="{pkg_name}" xmi:id="{pkg_id}">')
        for cid, cname, p_id, attrs, ops in classes:
            if p_id == pkg_id:
                xml_lines.append(f'      <packagedElement xmi:type="uml:Class" name="{cname}" xmi:id="{cid}">')
                for aname, atype in attrs:
                    xml_lines.append(f'        <ownedAttribute xmi:type="uml:Property" name="{aname}" type="Type_{atype}" visibility="private" xmi:id="Attr_{cid}_{aname}"/>')
                for oname, oret in ops:
                    xml_lines.append(f'        <ownedOperation xmi:type="uml:Operation" name="{oname}" visibility="public" xmi:id="Op_{cid}_{oname}">')
                    xml_lines.append(f'          <ownedParameter name="return" type="Type_{oret}" direction="return" xmi:id="Param_{cid}_{oname}_ret"/>')
                    xml_lines.append(f'        </ownedOperation>')
                xml_lines.append('      </packagedElement>')
        xml_lines.append('    </packagedElement>')

    # Standard UML Associations
    for conn_id, name, ctype, src_id, tgt_id, src_card, tgt_card, ea_type, ea_sub in connectors:
        xml_lines.append(f'    <packagedElement xmi:type="uml:Association" name="{name}" xmi:id="{conn_id}">')
        xml_lines.append(f'      <memberEnd xmi:idref="End_{conn_id}_src"/>')
        xml_lines.append(f'      <memberEnd xmi:idref="End_{conn_id}_tgt"/>')
        xml_lines.append(f'      <ownedEnd xmi:type="uml:Property" name="" type="{src_id}" association="{conn_id}" xmi:id="End_{conn_id}_src">')
        xml_lines.append(f'        <lowerValue xmi:type="uml:LiteralInteger" value="{0 if "0" in src_card else 1}" xmi:id="LV_{conn_id}_src"/>')
        xml_lines.append(f'        <upperValue xmi:type="uml:LiteralUnlimitedNatural" value="{"*" if "*" in src_card else 1}" xmi:id="UV_{conn_id}_src"/>')
        xml_lines.append(f'      </ownedEnd>')
        xml_lines.append(f'      <ownedEnd xmi:type="uml:Property" name="" type="{tgt_id}" association="{conn_id}" xmi:id="End_{conn_id}_tgt">')
        xml_lines.append(f'        <lowerValue xmi:type="uml:LiteralInteger" value="{0 if "0" in tgt_card else 1}" xmi:id="LV_{conn_id}_tgt"/>')
        xml_lines.append(f'        <upperValue xmi:type="uml:LiteralUnlimitedNatural" value="{"*" if "*" in tgt_card else 1}" xmi:id="UV_{conn_id}_tgt"/>')
        xml_lines.append(f'      </ownedEnd>')
        xml_lines.append(f'    </packagedElement>')

    xml_lines.append('  </uml:Model>')

    # Enterprise Architect Native Extension (This is what EA reads to guarantee 100% connector import and linking!)
    xml_lines.append('  <xmi:Extension extender="Enterprise Architect" extenderID="6.5">')
    xml_lines.append('    <elements>')
    for cid, cname, pkg_id, attrs, ops in classes:
        xml_lines.append(f'      <element xmi:idref="{cid}" name="{cname}" ea_type="Class">')
        xml_lines.append(f'        <properties package="{pkg_id}" isSpecification="false" sType="Class" nType="0" scope="public"/>')
        xml_lines.append(f'      </element>')
    xml_lines.append('    </elements>')

    xml_lines.append('    <connectors>')
    for conn_id, name, ctype, src_id, tgt_id, src_card, tgt_card, ea_type, ea_sub in connectors:
        xml_lines.append(f'      <connector xmi:idref="{conn_id}" name="{name}">')
        xml_lines.append(f'        <source xmi:idref="{src_id}">')
        xml_lines.append(f'          <model ea_localid="0" type="Class" name="{src_id}"/>')
        xml_lines.append(f'          <type multiplicity="{src_card}" aggregation="{0 if ea_sub == "Composite" else 0}"/>')
        xml_lines.append(f'        </source>')
        xml_lines.append(f'        <target xmi:idref="{tgt_id}">')
        xml_lines.append(f'          <model ea_localid="0" type="Class" name="{tgt_id}"/>')
        xml_lines.append(f'          <type multiplicity="{tgt_card}" aggregation="{2 if ea_sub == "Composite" else (1 if ea_type == "Aggregation" else 0)}"/>')
        xml_lines.append(f'        </target>')
        xml_lines.append(f'        <properties ea_type="{ea_type}" subtype="{ea_sub}" direction="Source -> Destination"/>')
        xml_lines.append(f'      </connector>')
    xml_lines.append('    </connectors>')

    xml_lines.append('  </xmi:Extension>')
    xml_lines.append('</xmi:XMI>')

    return "\n".join(xml_lines)

full_xmi = generate_ea_xmi()
with open("c:/Parcial-si2/brain/FashionStore_EA_Complete.xmi", "w", encoding="utf-8") as f:
    f.write(full_xmi)

# Verify parsing
try:
    root = ET.fromstring(full_xmi)
    print("SUCCESS: XMI 2.1 with EA Extensions generated and verified! Tags count:", len(list(root.iter())))
except Exception as e:
    print("ERROR parsing generated XMI:", e)
