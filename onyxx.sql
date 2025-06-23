--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5 (Homebrew)
-- Dumped by pg_dump version 17.5 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: jojo
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO jojo;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: assessment_elements; Type: TABLE; Schema: public; Owner: jojo
--

CREATE TABLE public.assessment_elements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    assessment_id uuid NOT NULL,
    element_id uuid NOT NULL,
    condition_rating integer,
    notes text,
    photo_urls jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT assessment_elements_condition_rating_check CHECK (((condition_rating >= 1) AND (condition_rating <= 5)))
);


ALTER TABLE public.assessment_elements OWNER TO jojo;

--
-- Name: assessments; Type: TABLE; Schema: public; Owner: jojo
--

CREATE TABLE public.assessments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    building_id uuid NOT NULL,
    type character varying(50) NOT NULL,
    description text,
    status character varying(50) DEFAULT 'pending'::character varying,
    scheduled_date timestamp without time zone,
    started_at timestamp without time zone,
    completed_at timestamp without time zone,
    assigned_to_user_id uuid,
    created_by_user_id uuid NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT assessments_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'in_progress'::character varying, 'completed'::character varying, 'cancelled'::character varying])::text[]))),
    CONSTRAINT assessments_type_check CHECK (((type)::text = ANY ((ARRAY['pre_assessment'::character varying, 'field_assessment'::character varying])::text[])))
);


ALTER TABLE public.assessments OWNER TO jojo;

--
-- Name: buildings; Type: TABLE; Schema: public; Owner: jojo
--

CREATE TABLE public.buildings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(150) NOT NULL,
    type character varying(100) NOT NULL,
    construction_type character varying(100),
    year_built integer,
    square_footage integer,
    state character varying(100),
    city character varying(100),
    zip_code character varying(20),
    street_address text,
    cost_per_sqft numeric(10,2),
    image_url text,
    created_by_user_id uuid,
    status character varying(20) DEFAULT 'pending'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.buildings OWNER TO jojo;

--
-- Name: elements; Type: TABLE; Schema: public; Owner: jojo
--

CREATE TABLE public.elements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    major_group character varying(100),
    group_element character varying(100),
    individual_element character varying(150)
);


ALTER TABLE public.elements OWNER TO jojo;

--
-- Name: fci_reports; Type: TABLE; Schema: public; Owner: jojo
--

CREATE TABLE public.fci_reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    building_id uuid,
    total_repair_cost numeric(12,2),
    replacement_cost numeric(12,2),
    fci_score numeric(5,4),
    report_url text,
    created_by uuid,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.fci_reports OWNER TO jojo;

--
-- Name: field_assessments; Type: TABLE; Schema: public; Owner: jojo
--

CREATE TABLE public.field_assessments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    building_id uuid,
    element_id uuid,
    condition character varying(20),
    repair_cost numeric(12,2),
    assessor_id uuid,
    photo_url text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT field_assessments_condition_check CHECK (((condition)::text = ANY ((ARRAY['Excellent'::character varying, 'Fair'::character varying, 'Needs Attention'::character varying])::text[])))
);


ALTER TABLE public.field_assessments OWNER TO jojo;

--
-- Name: pre_assessments; Type: TABLE; Schema: public; Owner: jojo
--

CREATE TABLE public.pre_assessments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    building_id uuid,
    element_id uuid,
    useful_life integer,
    install_year integer,
    repair_frequency character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.pre_assessments OWNER TO jojo;

--
-- Name: reference_building_costs; Type: TABLE; Schema: public; Owner: jojo
--

CREATE TABLE public.reference_building_costs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    building_type character varying(100),
    cost_per_sqft numeric(10,2)
);


ALTER TABLE public.reference_building_costs OWNER TO jojo;

--
-- Name: users; Type: TABLE; Schema: public; Owner: jojo
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash text NOT NULL,
    role character varying(20) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'manager'::character varying, 'assessor'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO jojo;

--
-- Data for Name: assessment_elements; Type: TABLE DATA; Schema: public; Owner: jojo
--

COPY public.assessment_elements (id, assessment_id, element_id, condition_rating, notes, photo_urls, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: assessments; Type: TABLE DATA; Schema: public; Owner: jojo
--

COPY public.assessments (id, building_id, type, description, status, scheduled_date, started_at, completed_at, assigned_to_user_id, created_by_user_id, notes, created_at, updated_at) FROM stdin;
9b148ec4-cf15-41bc-816a-66e17872bf14	251ecca1-8dd7-481a-b070-eeac64f1e149	pre_assessment	Pre-assessment for Northside Warehouse	pending	2025-06-19 22:55:59.222	\N	\N	62a271e4-8c6c-44a3-974d-74d82b711793	62a271e4-8c6c-44a3-974d-74d82b711793	\N	2025-06-19 23:55:59.238174	2025-06-19 23:55:59.238174
1b3d3abb-2a9a-46f4-aced-d7873989d3a8	4aaa20a5-823e-41db-b6f3-37297d9d9b6e	pre_assessment	Pre-assessment for City Hall	pending	2025-06-19 23:01:14.806	\N	\N	62a271e4-8c6c-44a3-974d-74d82b711793	62a271e4-8c6c-44a3-974d-74d82b711793	\N	2025-06-20 00:01:14.82029	2025-06-20 00:01:14.82029
624da078-111d-4138-b56b-e0d3efc25b15	6722d848-c6af-44a5-bd7b-a25adcf4bc44	pre_assessment	Pre-assessment for Central Mall	pending	2025-06-19 23:03:08.772	\N	\N	62a271e4-8c6c-44a3-974d-74d82b711793	62a271e4-8c6c-44a3-974d-74d82b711793	\N	2025-06-20 00:03:08.78762	2025-06-20 00:03:08.78762
2b2ea30c-112c-4a7e-9ec7-75b8c0a6bef2	6722d848-c6af-44a5-bd7b-a25adcf4bc44	pre_assessment	Pre-assessment for Central Mall	pending	2025-06-20 15:28:47.095	\N	\N	62a271e4-8c6c-44a3-974d-74d82b711793	62a271e4-8c6c-44a3-974d-74d82b711793	\N	2025-06-20 16:28:47.103339	2025-06-20 16:28:47.103339
59e36d19-af81-4c31-89df-7a971caa36be	c23f8399-f4b4-4b57-8054-76ae19bc390d	pre_assessment	Pre-assessment for Riverside Apartments	pending	2025-06-20 16:35:53.808	\N	\N	dc511603-6f16-4ee4-8b33-daeff1ececd7	dc511603-6f16-4ee4-8b33-daeff1ececd7	\N	2025-06-20 17:35:53.829496	2025-06-20 17:35:53.829496
a9eeacc0-ed82-45a4-83e3-45ce8f44e47f	6722d848-c6af-44a5-bd7b-a25adcf4bc44	pre_assessment	Pre-assessment for Central Mall	pending	2025-06-20 16:48:32.559	\N	\N	dc511603-6f16-4ee4-8b33-daeff1ececd7	dc511603-6f16-4ee4-8b33-daeff1ececd7	\N	2025-06-20 17:48:32.579177	2025-06-20 17:48:32.579177
f39d9cc1-2437-4c0b-aebb-fc9d7421dc7d	6722d848-c6af-44a5-bd7b-a25adcf4bc44	pre_assessment	Pre-assessment for Central Mall	pending	2025-06-20 16:53:27.349	\N	\N	dc511603-6f16-4ee4-8b33-daeff1ececd7	dc511603-6f16-4ee4-8b33-daeff1ececd7	\N	2025-06-20 17:53:27.364551	2025-06-20 17:53:27.364551
1a4fb680-6d04-4613-9170-2843bacdf31e	c23f8399-f4b4-4b57-8054-76ae19bc390d	pre_assessment	Pre-assessment for Riverside Apartments	completed	2025-06-20 21:32:57.952	\N	2025-06-20 21:40:36.501	dc511603-6f16-4ee4-8b33-daeff1ececd7	dc511603-6f16-4ee4-8b33-daeff1ececd7	Assessment completed with FCI of 0.0000. Total repair cost: $0	2025-06-20 22:32:57.968711	2025-06-20 22:40:36.519131
\.


--
-- Data for Name: buildings; Type: TABLE DATA; Schema: public; Owner: jojo
--

COPY public.buildings (id, name, type, construction_type, year_built, square_footage, state, city, zip_code, street_address, cost_per_sqft, image_url, created_by_user_id, status, created_at, updated_at) FROM stdin;
d10931cd-534b-4e17-b934-f171a90bb488	Oak Tower Office Complex	Office Building	Steel Frame	2010	150000	NY	New York	10001	123 Business Ave	300.00	https://images.unsplash.com/photo-1486406146926-c627a92ad1ab	62a271e4-8c6c-44a3-974d-74d82b711793	assessed	2025-06-13 20:34:48.557691	2025-06-13 20:34:48.557691
c23f8399-f4b4-4b57-8054-76ae19bc390d	Riverside Apartments	Residential Complex	Concrete	2015	200000	CA	Riverside	92501	456 River Road	200.00	https://images.unsplash.com/photo-1545324418-cc1a3fa10c00	62a271e4-8c6c-44a3-974d-74d82b711793	assessed	2025-06-13 20:34:48.564342	2025-06-13 20:34:48.564342
6722d848-c6af-44a5-bd7b-a25adcf4bc44	Central Mall	Retail	Steel Frame	2005	500000	TX	Dallas	75001	789 Shopping Blvd	180.00	https://images.unsplash.com/photo-1519567241046-7f570eee3ce6	62a271e4-8c6c-44a3-974d-74d82b711793	assessed	2025-06-13 20:34:48.565519	2025-06-13 20:34:48.565519
08747100-2e37-4d4f-b4bd-1caa9a718548	Tech Campus Building A	Office Building	Steel Frame	2018	180000	CA	Palo Alto	94025	321 Innovation Way	400.00	https://images.unsplash.com/photo-1497366754035-f200968a6e72	62a271e4-8c6c-44a3-974d-74d82b711793	pending	2025-06-13 20:34:48.566146	2025-06-13 20:34:48.566146
85529876-8c94-4302-b582-591de89487d5	Memorial Hospital - East Wing	Healthcare	Concrete	2012	120000	IL	Chicago	60601	555 Health Center Dr	750.00	https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d	62a271e4-8c6c-44a3-974d-74d82b711793	assessed	2025-06-13 20:34:48.567077	2025-06-13 20:34:48.567077
5432e801-33ec-4e37-a69a-b4fff85512da	Greenfield Elementary School	Educational	Masonry	1998	80000	OH	Columbus	43301	100 Education Lane	220.00	https://images.unsplash.com/photo-1580582932707-520aed937b7b	62a271e4-8c6c-44a3-974d-74d82b711793	assessed	2025-06-13 20:34:48.567455	2025-06-13 20:34:48.567455
251ecca1-8dd7-481a-b070-eeac64f1e149	Northside Warehouse	Industrial	Steel Frame	2008	250000	MI	Detroit	48201	2000 Industrial Pkwy	120.00	https://images.unsplash.com/photo-1553413077-190dd305871c	62a271e4-8c6c-44a3-974d-74d82b711793	pending	2025-06-13 20:34:48.568042	2025-06-13 20:34:48.568042
4aaa20a5-823e-41db-b6f3-37297d9d9b6e	City Hall	Government	Masonry	1985	100000	FL	Miami	33101	1 Civic Center Plaza	280.00	https://images.unsplash.com/photo-1555881400-74d7acaacd8b	62a271e4-8c6c-44a3-974d-74d82b711793	assessed	2025-06-13 20:34:48.568612	2025-06-13 20:34:48.568612
d528adbe-e6ae-471a-8dc7-2b51725800a6	Jones Hall	Hospitality	\N	2000	3000	CA	San Francisco	94122	3500 Judah street	200.00	blob:http://localhost:5173/41877f53-a315-4346-ae3e-25e5b952e206	a3f78853-504c-4055-a27c-d6a8daaa21e3	pending	2025-06-14 21:30:39.220644	2025-06-14 21:30:39.220644
3251da83-9a68-414e-98b2-74f06524e024	Jumbo House	Residential	\N	1999	150000	NC	Durham	32207	1300 Davies Drive	200.00	blob:http://localhost:5173/38803e10-d1c0-44c7-b50c-e301fe745ef5	62a271e4-8c6c-44a3-974d-74d82b711793	pending	2025-06-18 19:09:30.419783	2025-06-18 19:09:30.419783
\.


--
-- Data for Name: elements; Type: TABLE DATA; Schema: public; Owner: jojo
--

COPY public.elements (id, major_group, group_element, individual_element) FROM stdin;
45c31eba-db77-4a37-ac2a-49949aca013c	A - Substructure	A10 - Foundations	A1010 - Standard Foundations
c12f39f4-ed19-43ee-b3e4-fe1d1a108c9a	A - Substructure	A10 - Foundations	A1020 - Special Foundations
96297b6b-9711-4326-89f3-6d2b1f08df2a	A - Substructure	A20 - Basement Construction	A2010 - Basement Excavation
74af0b30-5756-47b6-b384-2dd8dfe43c7e	A - Substructure	A20 - Basement Construction	A2020 - Basement Walls
9441355b-9f87-4dd6-b93f-c4794fe8c9e5	B - Shell	B10 - Superstructure	B1010 - Floor Construction
675d6be6-ab91-468f-9d01-d46cc95dff62	B - Shell	B10 - Superstructure	B1020 - Roof Construction
917f9eed-c7f1-4502-b0f2-425159483cc3	B - Shell	B20 - Exterior Enclosure	B2010 - Exterior Walls
33cc55e4-43c1-4294-8eb3-812ffcc2080a	B - Shell	B20 - Exterior Enclosure	B2020 - Exterior Windows
1ac3bf0d-8d18-4973-b7c6-7542bfb3f73d	B - Shell	B20 - Exterior Enclosure	B2030 - Exterior Doors
404d0dd8-8da4-45dd-afce-e74dd5b1ed1b	B - Shell	B30 - Roofing	B3010 - Roof Coverings
9dd2d6fc-83da-45d5-96c3-2539abaef946	B - Shell	B30 - Roofing	B3020 - Roof Openings
3e1f6ea9-1df5-437e-9daf-85dd2d4614f1	C - Interiors	C10 - Interior Construction	C1010 - Partitions
c3e55397-eb01-48f8-bc5a-c29240b1aefa	C - Interiors	C10 - Interior Construction	C1020 - Interior Doors
d88c11de-278e-4eab-b7e9-7e0ec8470f24	C - Interiors	C10 - Interior Construction	C1030 - Fittings
30788e9e-b31b-4ab2-8dcb-221f24a04ab9	C - Interiors	C20 - Stairs	C2010 - Stair Construction
f1ecd346-7c05-4903-9af6-dbb793a01673	C - Interiors	C20 - Stairs	C2020 - Stair Finishes
c44ee745-4ffc-4a29-93fa-cad45b35b51d	C - Interiors	C30 - Interior Finishes	C3010 - Wall Finishes
d391a84b-19bb-4fb5-98d0-a0abf55676a9	C - Interiors	C30 - Interior Finishes	C3020 - Floor Finishes
bea1785b-91ea-48eb-a3d8-16c3adc315b9	C - Interiors	C30 - Interior Finishes	C3030 - Ceiling Finishes
a21ad945-5039-43d0-9601-ed565fc87c9e	D - Services	D10 - Conveying	D1010 - Elevators & Lifts
f5f74081-2252-4135-a0c5-5329f2805c5b	D - Services	D10 - Conveying	D1020 - Escalators
ddf1a585-9ba2-49e3-abf7-b0549d53ce4b	D - Services	D20 - Plumbing	D2010 - Plumbing Fixtures
12b1a858-5dc2-417a-892f-5f25c27c7dc0	D - Services	D20 - Plumbing	D2020 - Domestic Water Distribution
84f70cdc-341c-4eb9-bb6f-b0b97961aee7	D - Services	D20 - Plumbing	D2030 - Sanitary Drainage
bc8ee56e-c39f-4290-b6bc-f74e3e3f9545	D - Services	D30 - HVAC	D3010 - Energy Supply
d92448a6-c0cf-433f-85d9-f1bd1a74f611	D - Services	D30 - HVAC	D3020 - Heat Generating Systems
8ee1dc82-d9de-4d9d-98fd-653229cc2801	D - Services	D30 - HVAC	D3030 - Cooling Generating Systems
fc68c431-f8e5-41a0-af4e-3928b98dcd80	D - Services	D30 - HVAC	D3040 - Distribution Systems
046fbcc4-2d71-4055-9a96-e391fb8054e4	D - Services	D30 - HVAC	D3050 - Terminal & Package Units
3ac169c7-abe7-44f0-86ce-e3e303c02d4b	D - Services	D40 - Fire Protection	D4010 - Sprinklers
3d0671d0-005b-4984-a306-4a41114f1f33	D - Services	D40 - Fire Protection	D4020 - Standpipes
70a01736-d28b-4c4b-a739-bafe6d76c9ee	D - Services	D50 - Electrical	D5010 - Electrical Service & Distribution
97688e11-a2a8-4e56-aa31-3d83fffaef24	D - Services	D50 - Electrical	D5020 - Lighting & Branch Wiring
f0966157-67cf-4dd7-8d4f-24160f78e33c	D - Services	D50 - Electrical	D5030 - Communications & Security
1de49aa0-5949-4228-b419-265363a7aa19	E - Equipment & Furnishings	E10 - Equipment	E1010 - Commercial Equipment
29703659-9a0a-40ac-98a5-d5734c44ee17	E - Equipment & Furnishings	E10 - Equipment	E1020 - Institutional Equipment
94f70e41-79ff-4c2d-9997-39386900a0ae	E - Equipment & Furnishings	E20 - Furnishings	E2010 - Fixed Furnishings
ae568a72-73cf-4ff6-aaa6-a8a0cace99f7	F - Special Construction	F10 - Special Construction	F1010 - Special Structures
65ca06d0-9355-4bbd-931f-783f11fe02b9	F - Special Construction	F20 - Selective Demolition	F2010 - Building Elements Demolition
e8d97ebc-994a-4164-88b2-7891dbac6ae8	G - Building Sitework	G10 - Site Preparation	G1010 - Site Clearing
52ae119c-12d3-4ab1-8904-8ea16a87f301	G - Building Sitework	G20 - Site Improvements	G2010 - Roadways
5679e8d5-7cee-49dd-bf3e-91af2e555131	G - Building Sitework	G20 - Site Improvements	G2020 - Parking Lots
2b11d3a5-e24c-43ab-aa51-209376a03988	G - Building Sitework	G20 - Site Improvements	G2030 - Pedestrian Paving
e241f71d-b43a-4ac6-bcf8-a48374a0cd0e	G - Building Sitework	G20 - Site Improvements	G2040 - Site Development
a73c1a7a-8f4f-4edc-bd99-d975cd78e3fd	G - Building Sitework	G20 - Site Improvements	G2050 - Landscaping
c2740c78-6e4b-46e6-b434-e9b8d59c2d9d	G - Building Sitework	G30 - Site Civil/Mechanical Utilities	G3010 - Water Supply
c0bf7fb4-cc9c-47ba-a552-e0c2ff2f22df	G - Building Sitework	G30 - Site Civil/Mechanical Utilities	G3020 - Sanitary Sewer
61f10851-755b-48db-99fc-4386f1e53704	G - Building Sitework	G30 - Site Civil/Mechanical Utilities	G3030 - Storm Sewer
d4f01169-841c-47cd-b4b8-edd0e5a52165	G - Building Sitework	G40 - Site Electrical Utilities	G4010 - Electrical Distribution
f2cd04c2-4656-4d7d-897b-bec3962985b2	G - Building Sitework	G40 - Site Electrical Utilities	G4020 - Site Lighting
\.


--
-- Data for Name: fci_reports; Type: TABLE DATA; Schema: public; Owner: jojo
--

COPY public.fci_reports (id, building_id, total_repair_cost, replacement_cost, fci_score, report_url, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: field_assessments; Type: TABLE DATA; Schema: public; Owner: jojo
--

COPY public.field_assessments (id, building_id, element_id, condition, repair_cost, assessor_id, photo_url, created_at) FROM stdin;
\.


--
-- Data for Name: pre_assessments; Type: TABLE DATA; Schema: public; Owner: jojo
--

COPY public.pre_assessments (id, building_id, element_id, useful_life, install_year, repair_frequency, created_at) FROM stdin;
\.


--
-- Data for Name: reference_building_costs; Type: TABLE DATA; Schema: public; Owner: jojo
--

COPY public.reference_building_costs (id, building_type, cost_per_sqft) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: jojo
--

COPY public.users (id, name, email, password_hash, role, created_at) FROM stdin;
62a271e4-8c6c-44a3-974d-74d82b711793	Admin User	admin@onyx.com	$2a$10$tC6eYbsgZ1saI4b7C9FMlugbo47qBLhiJp1nluhG8gbnWgXKFIr76	admin	2025-06-13 14:07:46.658421
dc511603-6f16-4ee4-8b33-daeff1ececd7	Test User	test@example.com	$2a$10$Oih7wW3yvhou5MpUJBCB6O.2tweSl9tpW7WOFkWYoa/k/MvlYQbV6	admin	2025-06-13 17:24:35.195705
a3f78853-504c-4055-a27c-d6a8daaa21e3	Jones Joseph	joseph@example.com	$2a$10$2DLSyQJ3caQrL/dpnVThZOJj8wDhzdY2PqnX3H0FCgw1BC1EqaQyi	admin	2025-06-13 20:31:07.756773
f6cf7543-b418-4840-9026-38992739ded0	Test User	joseph@univelcity.com	$2a$10$oNlZyT0KdZDTACmHuE2WRejZQUQL6baTlxyFql3BNN5yycUBQEWn6	admin	2025-06-18 22:50:51.737082
\.


--
-- Name: assessment_elements assessment_elements_assessment_id_element_id_key; Type: CONSTRAINT; Schema: public; Owner: jojo
--

ALTER TABLE ONLY public.assessment_elements
    ADD CONSTRAINT assessment_elements_assessment_id_element_id_key UNIQUE (assessment_id, element_id);


--
-- Name: assessment_elements assessment_elements_pkey; Type: CONSTRAINT; Schema: public; Owner: jojo
--

ALTER TABLE ONLY public.assessment_elements
    ADD CONSTRAINT assessment_elements_pkey PRIMARY KEY (id);


--
-- Name: assessments assessments_pkey; Type: CONSTRAINT; Schema: public; Owner: jojo
--

ALTER TABLE ONLY public.assessments
    ADD CONSTRAINT assessments_pkey PRIMARY KEY (id);


--
-- Name: buildings buildings_pkey; Type: CONSTRAINT; Schema: public; Owner: jojo
--

ALTER TABLE ONLY public.buildings
    ADD CONSTRAINT buildings_pkey PRIMARY KEY (id);


--
-- Name: elements elements_pkey; Type: CONSTRAINT; Schema: public; Owner: jojo
--

ALTER TABLE ONLY public.elements
    ADD CONSTRAINT elements_pkey PRIMARY KEY (id);


--
-- Name: fci_reports fci_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: jojo
--

ALTER TABLE ONLY public.fci_reports
    ADD CONSTRAINT fci_reports_pkey PRIMARY KEY (id);


--
-- Name: field_assessments field_assessments_pkey; Type: CONSTRAINT; Schema: public; Owner: jojo
--

ALTER TABLE ONLY public.field_assessments
    ADD CONSTRAINT field_assessments_pkey PRIMARY KEY (id);


--
-- Name: pre_assessments pre_assessments_pkey; Type: CONSTRAINT; Schema: public; Owner: jojo
--

ALTER TABLE ONLY public.pre_assessments
    ADD CONSTRAINT pre_assessments_pkey PRIMARY KEY (id);


--
-- Name: reference_building_costs reference_building_costs_pkey; Type: CONSTRAINT; Schema: public; Owner: jojo
--

ALTER TABLE ONLY public.reference_building_costs
    ADD CONSTRAINT reference_building_costs_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: jojo
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: jojo
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_assessment_elements_assessment_id; Type: INDEX; Schema: public; Owner: jojo
--

CREATE INDEX idx_assessment_elements_assessment_id ON public.assessment_elements USING btree (assessment_id);


--
-- Name: idx_assessment_elements_element_id; Type: INDEX; Schema: public; Owner: jojo
--

CREATE INDEX idx_assessment_elements_element_id ON public.assessment_elements USING btree (element_id);


--
-- Name: idx_assessments_assigned_to; Type: INDEX; Schema: public; Owner: jojo
--

CREATE INDEX idx_assessments_assigned_to ON public.assessments USING btree (assigned_to_user_id);


--
-- Name: idx_assessments_building_id; Type: INDEX; Schema: public; Owner: jojo
--

CREATE INDEX idx_assessments_building_id ON public.assessments USING btree (building_id);


--
-- Name: idx_assessments_status; Type: INDEX; Schema: public; Owner: jojo
--

CREATE INDEX idx_assessments_status ON public.assessments USING btree (status);


--
-- Name: idx_assessments_type; Type: INDEX; Schema: public; Owner: jojo
--

CREATE INDEX idx_assessments_type ON public.assessments USING btree (type);


--
-- Name: assessment_elements assessment_elements_assessment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: jojo
--

ALTER TABLE ONLY public.assessment_elements
    ADD CONSTRAINT assessment_elements_assessment_id_fkey FOREIGN KEY (assessment_id) REFERENCES public.assessments(id) ON DELETE CASCADE;


--
-- Name: assessment_elements assessment_elements_element_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: jojo
--

ALTER TABLE ONLY public.assessment_elements
    ADD CONSTRAINT assessment_elements_element_id_fkey FOREIGN KEY (element_id) REFERENCES public.elements(id);


--
-- Name: assessments assessments_assigned_to_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: jojo
--

ALTER TABLE ONLY public.assessments
    ADD CONSTRAINT assessments_assigned_to_user_id_fkey FOREIGN KEY (assigned_to_user_id) REFERENCES public.users(id);


--
-- Name: assessments assessments_building_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: jojo
--

ALTER TABLE ONLY public.assessments
    ADD CONSTRAINT assessments_building_id_fkey FOREIGN KEY (building_id) REFERENCES public.buildings(id) ON DELETE CASCADE;


--
-- Name: assessments assessments_created_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: jojo
--

ALTER TABLE ONLY public.assessments
    ADD CONSTRAINT assessments_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.users(id);


--
-- Name: buildings buildings_created_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: jojo
--

ALTER TABLE ONLY public.buildings
    ADD CONSTRAINT buildings_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.users(id);


--
-- Name: fci_reports fci_reports_building_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: jojo
--

ALTER TABLE ONLY public.fci_reports
    ADD CONSTRAINT fci_reports_building_id_fkey FOREIGN KEY (building_id) REFERENCES public.buildings(id);


--
-- Name: fci_reports fci_reports_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: jojo
--

ALTER TABLE ONLY public.fci_reports
    ADD CONSTRAINT fci_reports_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: field_assessments field_assessments_assessor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: jojo
--

ALTER TABLE ONLY public.field_assessments
    ADD CONSTRAINT field_assessments_assessor_id_fkey FOREIGN KEY (assessor_id) REFERENCES public.users(id);


--
-- Name: field_assessments field_assessments_building_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: jojo
--

ALTER TABLE ONLY public.field_assessments
    ADD CONSTRAINT field_assessments_building_id_fkey FOREIGN KEY (building_id) REFERENCES public.buildings(id);


--
-- Name: field_assessments field_assessments_element_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: jojo
--

ALTER TABLE ONLY public.field_assessments
    ADD CONSTRAINT field_assessments_element_id_fkey FOREIGN KEY (element_id) REFERENCES public.elements(id);


--
-- Name: pre_assessments pre_assessments_building_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: jojo
--

ALTER TABLE ONLY public.pre_assessments
    ADD CONSTRAINT pre_assessments_building_id_fkey FOREIGN KEY (building_id) REFERENCES public.buildings(id);


--
-- Name: pre_assessments pre_assessments_element_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: jojo
--

ALTER TABLE ONLY public.pre_assessments
    ADD CONSTRAINT pre_assessments_element_id_fkey FOREIGN KEY (element_id) REFERENCES public.elements(id);


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: josephagunbiade
--

ALTER DEFAULT PRIVILEGES FOR ROLE josephagunbiade IN SCHEMA public GRANT SELECT,INSERT,DELETE,UPDATE ON TABLES TO jojo;


--
-- PostgreSQL database dump complete
--

