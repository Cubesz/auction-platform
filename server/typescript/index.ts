import { randomUUID } from "crypto";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import express, { type Request, type Response, type NextFunction } from "express";
import morgan from "morgan";
import { z } from "zod";

const PORT = 3001;
const __dirname = dirname(fileURLToPath(import.meta.url));

// ============================================================
// Types
// ============================================================

type Category = "tractor" | "combine" | "implement" | "attachment";
type Status = "active" | "closed" | "pending";

interface Listing {
	id: string;
	title: string;
	description: string;
	category: Category;
	startingPrice: number;
	currentBid: number;
	currentBidder: string | null;
	status: Status;
	endsAt: string;
	imageUrl: string;
	// To store records of past bids. Who bid what and when.
	bids: { amount: number; bidder: string; timestamp: string }[];
}

const BidSchema = z.object({
	bidder: z.string().min(1, "Bidder name is required"),
	amount: z.number().positive("Bid amount must be a positive number"),
});
type BidRequest = z.infer<typeof BidSchema>;

const CreateListingSchema = z.object({
	title: z.string().min(1, "Title is required"),
});
type CreateListingRequest = z.infer<typeof CreateListingSchema>;

// ============================================================
// In-memory store — seeded from data/listings.json
// ============================================================

const listings: Listing[] = JSON.parse(
	readFileSync(join(__dirname, "data", "listings.json"), "utf-8"),
).map((l: any) => ({ ...l, bids: l.bids || [] }));

// ============================================================
// App
// ============================================================

const app = express();

app.use(morgan("dev"));
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

// GET /api/listings
app.get("/api/listings", (req: Request, res: Response) => {
	const { q, category } = req.query;
	let result = listings;

	if (typeof q === "string" && q.trim() !== "") {
		const lowerQ = q.toLowerCase();
		result = result.filter(
			(l) =>
				l.title.toLowerCase().includes(lowerQ) ||
				l.description.toLowerCase().includes(lowerQ),
		);
	}

	if (typeof category === "string" && category !== "all") {
		result = result.filter((l) => l.category === category);
	}

	res.json(result);
});

// POST /api/listings
app.post("/api/listings", (req: Request, res: Response) => {
	const parseResult = CreateListingSchema.safeParse(req.body);
	if (!parseResult.success) {
		return res.status(400).json({ error: parseResult.error.issues[0].message });
	}
	const { title } = parseResult.data;

	const listing: Listing = {
		id: randomUUID(),
		title: title.trim(),
		description: "",
		category: "implement",
		startingPrice: 0,
		currentBid: 0,
		currentBidder: null,
		status: "active",
		endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
		imageUrl: "",
		bids: [],
	};

	listings.push(listing);
	return res.status(201).json(listing);
});

// GET /api/listings/:id
app.get("/api/listings/:id", (req: Request, res: Response) => {
	const listing = listings.find((l) => l.id === req.params.id);
	if (!listing) {
		return res.status(404).json({ error: "Listing not found" });
	}
	return res.json(listing);
});

// POST /api/listings/:id/bids
app.post("/api/listings/:id/bids", (req: Request, res: Response) => {
	const listing = listings.find((l) => l.id === req.params.id);
	if (!listing) {
		return res.status(404).json({ error: "Listing not found" });
	}

	if (listing.status !== "active") {
		return res
			.status(400)
			.json({ error: "This listing is not currently active" });
	}

	const parseResult = BidSchema.safeParse(req.body);
	if (!parseResult.success) {
		return res.status(400).json({ error: parseResult.error.issues[0].message });
	}
	const bid = parseResult.data;

	if (bid.amount <= listing.currentBid) {
		return res.status(400).json({
			error: `Bid must be greater than the current bid of $${listing.currentBid.toLocaleString()}`,
		});
	}

	listing.currentBid = bid.amount;
	listing.currentBidder = bid.bidder.trim();
	listing.bids.unshift({
		amount: bid.amount,
		bidder: bid.bidder.trim(),
		timestamp: new Date().toISOString(),
	});

	return res.status(201).json(listing);
});

// GET /api/listings/:id/bids
app.get("/api/listings/:id/bids", (req: Request, res: Response) => {
	const listing = listings.find((l) => l.id === req.params.id);
	if (!listing) {
		return res.status(404).json({ error: "Listing not found" });
	}
	return res.json(listing.bids);
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
	console.error("[Unhandled Error]:", err);
	res.status(500).json({ error: "Internal Server Error" });
});

app.listen(PORT, () => {
	console.log(`Server running at http://localhost:${PORT}`);
});
