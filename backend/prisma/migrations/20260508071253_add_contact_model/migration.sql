-- CreateTable
CREATE TABLE "Contact" (
    "id" SERIAL NOT NULL,
    "reference" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Contact_reference_key" ON "Contact"("reference");

-- CreateIndex
CREATE INDEX "Contact_email_createdAt_idx" ON "Contact"("email", "createdAt");
