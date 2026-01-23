"""Data generation CLI commands."""
import asyncio

import click

from scavenger.db.models.alarm import DataLayer


@click.group()
def generate() -> None:
    """Synthetic data generation commands."""
    pass


@generate.command()
@click.option("--count", "-n", default=100, help="Number of alarms to generate")
@click.option(
    "--layer",
    type=click.Choice(["schema", "vendor", "physics"]),
    default="schema",
    help="Data layer",
)
@click.option("--start-alid", default=1, help="Starting ALID number")
@click.option("--seed", type=int, help="Random seed for reproducibility")
@click.option("--dry-run", is_flag=True, help="Preview without saving to DB")
def alarms(
    count: int,
    layer: str,
    start_alid: int,
    seed: int | None,
    dry_run: bool,
) -> None:
    """Generate synthetic alarms."""
    from scavenger.generate.schema_alarms import SchemaAlarmGenerator

    if layer != "schema":
        click.echo(f"Layer '{layer}' not yet implemented. Using 'schema'.")

    gen = SchemaAlarmGenerator(seed=seed)
    alarms_list = gen.generate_batch(count=count, start_alid=start_alid)

    if dry_run:
        click.echo(f"Generated {len(alarms_list)} alarms (dry run):\n")
        for alarm in alarms_list[:10]:
            click.echo(f"  ALID={alarm.alid} ALCD={alarm.alcd.value} [{alarm.severity}]")
            click.echo(f"    {alarm.altx}")
        if len(alarms_list) > 10:
            click.echo(f"  ... and {len(alarms_list) - 10} more")
        return

    async def save_alarms() -> None:
        from scavenger.db.models.provenance import Provenance, SourceType
        from scavenger.db.session import get_session

        async with get_session() as session:
            provenance = Provenance(
                source_type=SourceType.SYNTHETIC,
                generation_params={
                    "generator": "SchemaAlarmGenerator",
                    "seed": seed,
                    "count": count,
                    "start_alid": start_alid,
                },
            )
            session.add(provenance)
            await session.flush()

            for alarm in alarms_list:
                alarm.provenance_id = provenance.id
                session.add(alarm)

            await session.commit()

        click.echo(f"Saved {len(alarms_list)} alarms to database.")

    asyncio.run(save_alarms())
