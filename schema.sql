


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."auto_flag_insurance"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.damage_cause IN ('power_event','environmental') THEN
    NEW.insurance_claim = true;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."auto_flag_insurance"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_category_delete"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE public.assets
  SET asset_type = 'other'
  WHERE asset_type = OLD.slug;
  RETURN OLD;
END;
$$;


ALTER FUNCTION "public"."handle_category_delete"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, avatar_url, role, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1), 'Unknown'),
    LOWER(NEW.email),
    NEW.raw_user_meta_data->>'avatar_url',
    'employee',
    'active'
  )
  ON CONFLICT (email) DO NOTHING;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reassign_assets_on_category_create"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF NEW.tag_prefix IS NOT NULL AND NEW.tag_prefix != '' THEN
    UPDATE public.assets
    SET asset_type = NEW.slug
    WHERE asset_tag LIKE (NEW.tag_prefix || '-%')
      AND (asset_type = 'other' OR asset_type NOT IN (
        SELECT slug FROM public.asset_categories
      ));
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."reassign_assets_on_category_create"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_profiles_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;


ALTER FUNCTION "public"."update_profiles_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;


ALTER FUNCTION "public"."update_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."asset_audit_log" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "asset_id" "uuid" NOT NULL,
    "action" "text" NOT NULL,
    "actor_id" "uuid",
    "before_state" "jsonb",
    "after_state" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "asset_audit_log_action_check" CHECK (("action" = ANY (ARRAY['created'::"text", 'updated'::"text", 'status_changed'::"text", 'assigned'::"text", 'returned'::"text", 'repair_opened'::"text", 'repair_closed'::"text", 'retired'::"text"])))
);


ALTER TABLE "public"."asset_audit_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."asset_categories" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "classification" "text" NOT NULL,
    "icon" "text" DEFAULT 'Package'::"text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "tag_prefix" "text" DEFAULT ''::"text",
    CONSTRAINT "asset_categories_classification_check" CHECK (("classification" = ANY (ARRAY['employee_allocated'::"text", 'company_allocated'::"text"])))
);


ALTER TABLE "public"."asset_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."asset_files" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "asset_id" "uuid" NOT NULL,
    "file_name" "text" NOT NULL,
    "file_size" bigint NOT NULL,
    "file_type" "text" NOT NULL,
    "storage_path" "text" NOT NULL,
    "uploaded_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."asset_files" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."assets" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "asset_tag" "text" NOT NULL,
    "classification" "text" NOT NULL,
    "asset_type" "text" NOT NULL,
    "price_pkr" numeric DEFAULT 0 NOT NULL,
    "vendor_name" "text" DEFAULT ''::"text" NOT NULL,
    "vendor_phone" "text" DEFAULT ''::"text" NOT NULL,
    "invoice_number" "text" DEFAULT ''::"text" NOT NULL,
    "purchase_date" "date",
    "warranty_expiry" "date",
    "warranty_type" "text" DEFAULT 'none'::"text" NOT NULL,
    "specs" "text" DEFAULT ''::"text" NOT NULL,
    "serial_number" "text",
    "pta_status" "text",
    "allotted_user_id" "uuid",
    "location" "text",
    "status" "text" DEFAULT 'available'::"text" NOT NULL,
    "retirement_reason" "text",
    "condition" "text" DEFAULT 'good'::"text" NOT NULL,
    "notes" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "allotted_user_name" "text",
    "manufacturer" "text" DEFAULT ''::"text" NOT NULL,
    "allotted_user_email" "text",
    CONSTRAINT "assets_classification_check" CHECK (("classification" = ANY (ARRAY['company_allocated'::"text", 'employee_allocated'::"text"]))),
    CONSTRAINT "assets_condition_check" CHECK (("condition" = ANY (ARRAY['good'::"text", 'fair'::"text", 'poor'::"text", 'dead'::"text"]))),
    CONSTRAINT "assets_pta_status_check" CHECK (("pta_status" = ANY (ARRAY['pta_approved'::"text", 'non_pta'::"text", 'unknown'::"text"]))),
    CONSTRAINT "assets_retirement_reason_check" CHECK (("retirement_reason" = ANY (ARRAY['end_of_life'::"text", 'beyond_repair'::"text", 'replaced'::"text", 'stolen'::"text", 'lost'::"text"]))),
    CONSTRAINT "assets_status_check" CHECK (("status" = ANY (ARRAY['available'::"text", 'allotted'::"text", 'in_repair'::"text", 'retired'::"text"]))),
    CONSTRAINT "assets_warranty_type_check" CHECK (("warranty_type" = ANY (ARRAY['manufacturer'::"text", 'vendor'::"text", 'none'::"text"])))
);


ALTER TABLE "public"."assets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."consumable_inventory" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "sku" "text" NOT NULL,
    "name" "text" NOT NULL,
    "compatible_model" "text",
    "current_stock" integer DEFAULT 0 NOT NULL,
    "min_stock" integer DEFAULT 1 NOT NULL,
    "unit_cost_pkr" numeric DEFAULT 0 NOT NULL,
    "storage_location" "text" DEFAULT 'IT Store'::"text" NOT NULL,
    "vendor_name" "text" DEFAULT ''::"text" NOT NULL,
    "vendor_phone" "text" DEFAULT ''::"text" NOT NULL,
    "last_restocked_at" timestamp with time zone,
    "last_restocked_by" "uuid"
);


ALTER TABLE "public"."consumable_inventory" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "avatar_url" "text",
    "role" "text" DEFAULT 'admin'::"text" NOT NULL,
    "designation" "text",
    "department" "text",
    "engagement_type" "text" DEFAULT 'permanent'::"text" NOT NULL,
    "engagement_end_date" "date",
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "manually_created" boolean DEFAULT false,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "profiles_engagement_type_check" CHECK (("engagement_type" = ANY (ARRAY['permanent'::"text", 'contract'::"text", 'intern'::"text"]))),
    CONSTRAINT "profiles_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'manager'::"text", 'finance'::"text", 'employee'::"text"]))),
    CONSTRAINT "profiles_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."repair_records" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "asset_id" "uuid" NOT NULL,
    "fault_description" "text" NOT NULL,
    "repair_vendor_name" "text" NOT NULL,
    "repair_vendor_phone" "text" NOT NULL,
    "date_sent" "date" DEFAULT CURRENT_DATE NOT NULL,
    "expected_return_date" "date" NOT NULL,
    "actual_return_date" "date",
    "estimated_cost_pkr" numeric,
    "final_cost_pkr" numeric,
    "damage_cause" "text" DEFAULT 'unknown'::"text" NOT NULL,
    "warranty_claim" boolean DEFAULT false NOT NULL,
    "warranty_claim_ref" "text",
    "insurance_claim" boolean DEFAULT false NOT NULL,
    "status" "text" DEFAULT 'open'::"text" NOT NULL,
    "resolved_status" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "completed_at" timestamp with time zone,
    "original_user_id" "uuid",
    CONSTRAINT "repair_records_damage_cause_check" CHECK (("damage_cause" = ANY (ARRAY['normal_wear'::"text", 'user_damage'::"text", 'power_event'::"text", 'environmental'::"text", 'unknown'::"text"]))),
    CONSTRAINT "repair_records_resolved_status_check" CHECK (("resolved_status" = ANY (ARRAY['available'::"text", 'allotted'::"text", 'retired'::"text"]))),
    CONSTRAINT "repair_records_status_check" CHECK (("status" = ANY (ARRAY['open'::"text", 'completed'::"text", 'vendor_unresponsive'::"text"])))
);


ALTER TABLE "public"."repair_records" OWNER TO "postgres";


ALTER TABLE ONLY "public"."asset_audit_log"
    ADD CONSTRAINT "asset_audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."asset_categories"
    ADD CONSTRAINT "asset_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."asset_files"
    ADD CONSTRAINT "asset_files_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."assets"
    ADD CONSTRAINT "assets_asset_tag_key" UNIQUE ("asset_tag");



ALTER TABLE ONLY "public"."assets"
    ADD CONSTRAINT "assets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."assets"
    ADD CONSTRAINT "assets_serial_number_key" UNIQUE ("serial_number");



ALTER TABLE ONLY "public"."consumable_inventory"
    ADD CONSTRAINT "consumable_inventory_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."consumable_inventory"
    ADD CONSTRAINT "consumable_inventory_sku_key" UNIQUE ("sku");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."repair_records"
    ADD CONSTRAINT "repair_records_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_assets_allotted_user" ON "public"."assets" USING "btree" ("allotted_user_id");



CREATE INDEX "idx_assets_classification" ON "public"."assets" USING "btree" ("classification");



CREATE INDEX "idx_assets_status" ON "public"."assets" USING "btree" ("status");



CREATE INDEX "idx_assets_type" ON "public"."assets" USING "btree" ("asset_type");



CREATE INDEX "idx_audit_asset" ON "public"."asset_audit_log" USING "btree" ("asset_id");



CREATE INDEX "idx_repair_status" ON "public"."repair_records" USING "btree" ("status");



CREATE OR REPLACE TRIGGER "assets_updated_at" BEFORE UPDATE ON "public"."assets" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "on_category_created" AFTER INSERT ON "public"."asset_categories" FOR EACH ROW EXECUTE FUNCTION "public"."reassign_assets_on_category_create"();



CREATE OR REPLACE TRIGGER "on_category_deleted" BEFORE DELETE ON "public"."asset_categories" FOR EACH ROW EXECUTE FUNCTION "public"."handle_category_delete"();



CREATE OR REPLACE TRIGGER "profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_profiles_updated_at"();



CREATE OR REPLACE TRIGGER "repair_insurance_flag" BEFORE INSERT OR UPDATE ON "public"."repair_records" FOR EACH ROW EXECUTE FUNCTION "public"."auto_flag_insurance"();



ALTER TABLE ONLY "public"."asset_audit_log"
    ADD CONSTRAINT "asset_audit_log_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."asset_audit_log"
    ADD CONSTRAINT "asset_audit_log_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."asset_files"
    ADD CONSTRAINT "asset_files_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."asset_files"
    ADD CONSTRAINT "asset_files_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."assets"
    ADD CONSTRAINT "assets_allotted_user_id_fkey" FOREIGN KEY ("allotted_user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."assets"
    ADD CONSTRAINT "assets_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."consumable_inventory"
    ADD CONSTRAINT "consumable_inventory_last_restocked_by_fkey" FOREIGN KEY ("last_restocked_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."repair_records"
    ADD CONSTRAINT "repair_records_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."repair_records"
    ADD CONSTRAINT "repair_records_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."repair_records"
    ADD CONSTRAINT "repair_records_original_user_id_fkey" FOREIGN KEY ("original_user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



CREATE POLICY "Admins can manage categories" ON "public"."asset_categories" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can manage consumables" ON "public"."consumable_inventory" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "All authenticated can view categories" ON "public"."asset_categories" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can view consumables" ON "public"."consumable_inventory" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "admins_all_asset_files" ON "public"."asset_files" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text") AND ("profiles"."status" = 'active'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text") AND ("profiles"."status" = 'active'::"text")))));



CREATE POLICY "admins_all_repairs" ON "public"."repair_records" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text") AND ("profiles"."status" = 'active'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text") AND ("profiles"."status" = 'active'::"text")))));



CREATE POLICY "admins_delete_assets" ON "public"."assets" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text") AND ("profiles"."status" = 'active'::"text")))));



CREATE POLICY "admins_insert_assets" ON "public"."assets" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text") AND ("profiles"."status" = 'active'::"text")))));



CREATE POLICY "admins_insert_audit_log" ON "public"."asset_audit_log" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text") AND ("profiles"."status" = 'active'::"text")))));



CREATE POLICY "admins_select_assets" ON "public"."assets" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text") AND ("profiles"."status" = 'active'::"text")))));



CREATE POLICY "admins_select_audit_log" ON "public"."asset_audit_log" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text") AND ("profiles"."status" = 'active'::"text")))));



CREATE POLICY "admins_update_assets" ON "public"."assets" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text") AND ("profiles"."status" = 'active'::"text")))));



ALTER TABLE "public"."asset_audit_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."asset_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."asset_files" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."assets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."consumable_inventory" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."repair_records" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































GRANT ALL ON FUNCTION "public"."auto_flag_insurance"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_flag_insurance"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_flag_insurance"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_category_delete"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_category_delete"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_category_delete"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."reassign_assets_on_category_create"() TO "anon";
GRANT ALL ON FUNCTION "public"."reassign_assets_on_category_create"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."reassign_assets_on_category_create"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_profiles_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_profiles_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_profiles_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "service_role";


















GRANT ALL ON TABLE "public"."asset_audit_log" TO "anon";
GRANT ALL ON TABLE "public"."asset_audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."asset_audit_log" TO "service_role";



GRANT ALL ON TABLE "public"."asset_categories" TO "anon";
GRANT ALL ON TABLE "public"."asset_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."asset_categories" TO "service_role";



GRANT ALL ON TABLE "public"."asset_files" TO "anon";
GRANT ALL ON TABLE "public"."asset_files" TO "authenticated";
GRANT ALL ON TABLE "public"."asset_files" TO "service_role";



GRANT ALL ON TABLE "public"."assets" TO "anon";
GRANT ALL ON TABLE "public"."assets" TO "authenticated";
GRANT ALL ON TABLE "public"."assets" TO "service_role";



GRANT ALL ON TABLE "public"."consumable_inventory" TO "anon";
GRANT ALL ON TABLE "public"."consumable_inventory" TO "authenticated";
GRANT ALL ON TABLE "public"."consumable_inventory" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."repair_records" TO "anon";
GRANT ALL ON TABLE "public"."repair_records" TO "authenticated";
GRANT ALL ON TABLE "public"."repair_records" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































